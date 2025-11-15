import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";
import { getDocument } from "npm:pdfjs-dist@4.8.69";

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
    const uint8Array = new Uint8Array(fileBuffer);

    console.log("Starting PDF parsing...");

    let text = "";
    let pageCount = 0;

    try {
      const loadingTask = getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: true,
        standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/",
      });

      const pdf = await loadingTask.promise;
      pageCount = pdf.numPages;
      console.log(`PDF has ${pageCount} pages`);

      const textParts: string[] = [];

      for (let i = 1; i <= pageCount; i++) {
        console.log(`Extracting text from page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        textParts.push(pageText);
      }

      text = textParts.join('\n\n');
      console.log(`Extracted ${text.length} characters of text`);
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }

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

    console.log(`Creating ${chunks.length} chunks...`);

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding ${i + 1}/${chunks.length}...`);
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload failed",
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