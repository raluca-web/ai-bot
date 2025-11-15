import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });

    let rawText = '';
    try {
      rawText = decoder.decode(uint8Array);
    } catch {
      const latin1Decoder = new TextDecoder('iso-8859-1');
      rawText = latin1Decoder.decode(uint8Array);
    }

    const textParts: string[] = [];
    const streamPattern = /stream\s*(.*)\s*endstream/gs;
    const matches = rawText.matchAll(streamPattern);

    for (const match of matches) {
      const streamContent = match[1];
      const cleanText = streamContent
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText && cleanText.length > 10) {
        textParts.push(cleanText);
      }
    }

    const objPattern = /\/Type\s*\/Page[^>]*?>>|BT\s*(.*)\s*ET/gs;
    const objMatches = rawText.matchAll(objPattern);

    for (const match of objMatches) {
      if (match[1]) {
        const cleanText = match[1]
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText && cleanText.length > 10) {
          textParts.push(cleanText);
        }
      }
    }

    const pagePattern = /\/Type\s*\/Page/g;
    const pageMatches = rawText.match(pagePattern);
    const pageCount = pageMatches ? pageMatches.length : 1;

    const text = textParts.join('\n\n').trim();

    if (!text || text.length < 50) {
      throw new Error('Could not extract sufficient text from PDF');
    }

    return {
      text,
      pageCount
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    const fileBuffer = await file.arrayBuffer();

    console.log("Extracting text from PDF...");

    const { text, pageCount } = await extractTextFromPDF(fileBuffer);

    console.log(`Extracted ${text.length} characters from ${pageCount} pages`);

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in PDF");
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
      throw docError;
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
      const chunk = chunks[i];
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
    }

    console.log("Saving embeddings to database...");

    const { error: embeddingError } = await supabase
      .from("document_embeddings")
      .insert(embeddings);

    if (embeddingError) {
      console.error("Embedding error:", embeddingError);
      throw embeddingError;
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
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorStack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});