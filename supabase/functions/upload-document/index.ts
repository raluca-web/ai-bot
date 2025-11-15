import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("=== Starting upload ===");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasOpenAIKey: !!openaiApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured. Please add it to your Supabase project secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    console.log("Parsing form data...");
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size}`);

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    console.log("Reading file buffer...");
    const fileBuffer = await file.arrayBuffer();
    console.log(`Buffer size: ${fileBuffer.byteLength} bytes`);

    console.log("Extracting text from PDF...");
    const uint8Array = new Uint8Array(fileBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(uint8Array);

    const textParts: string[] = [];
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;

    while ((match = streamPattern.exec(rawText)) !== null) {
      const streamContent = match[1];
      const cleanText = streamContent
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText && cleanText.length > 10) {
        textParts.push(cleanText);
      }
    }

    console.log(`Extracted ${textParts.length} text parts from streams`);

    const pagePattern = /\/Type\s*\/Page/g;
    const pageMatches = rawText.match(pagePattern);
    const pageCount = pageMatches ? pageMatches.length : 1;

    const text = textParts.join('\n\n').trim();
    console.log(`Final text length: ${text.length} characters, ${pageCount} pages`);

    if (!text || text.length < 50) {
      throw new Error(`Could not extract sufficient text from PDF (only got ${text.length} characters). The PDF may be image-based or encrypted.`);
    }

    console.log("Saving document to database...");
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title: file.name.replace(".pdf", ""),
        filename: file.name,
        file_size: file.size,
        page_count: pageCount,
        content: text,
      })
      .select()
      .single();

    if (docError) {
      console.error("Database error:", docError);
      throw new Error(`Database error: ${docError.message}`);
    }

    console.log(`Document saved with ID: ${document.id}`);

    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    console.log(`Creating ${chunks.length} embeddings...`);

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      const chunk = chunks[i];

      try {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        });

        embeddings.push({
          document_id: document.id,
          content: chunk,
          embedding: embeddingResponse.data[0].embedding,
          chunk_index: i,
        });
      } catch (openaiError: any) {
        console.error(`OpenAI error on chunk ${i}:`, openaiError);
        throw new Error(`OpenAI API error: ${openaiError.message || 'Unknown error'}`);
      }
    }

    console.log("Saving embeddings to database...");
    const { error: embeddingError } = await supabase
      .from("document_embeddings")
      .insert(embeddings);

    if (embeddingError) {
      console.error("Embedding save error:", embeddingError);
      throw new Error(`Failed to save embeddings: ${embeddingError.message}`);
    }

    console.log("Upload complete!");

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          chunks: chunks.length,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("=== Upload error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Full error:", error);

    return new Response(
      JSON.stringify({
        error: error?.message || "Upload failed",
        type: error?.constructor?.name || "UnknownError",
        stack: error?.stack || "No stack trace available"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );  }
});