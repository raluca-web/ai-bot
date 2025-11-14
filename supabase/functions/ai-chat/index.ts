import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  question: string;
  conversationId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { question, conversationId }: ChatRequest = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: question,
        model: 'text-embedding-3-small',
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;

    const { data: relevantChunks, error: searchError } = await supabase.rpc(
      'search_documents',
      {
        query_embedding: questionEmbedding,
        match_threshold: 0.7,
        match_count: 5,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
    }

    const context = relevantChunks && relevantChunks.length > 0
      ? relevantChunks.map((chunk: any) => chunk.chunk_text).join('\n\n')
      : '';

    let conversationHistory = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (messages) {
        conversationHistory = messages;
      }
    }

    const systemPrompt = `You are a helpful AI assistant that answers questions based on software documentation. Your responses should be:
- Clear and conversational, like talking to a human
- Helpful and informative
- Based strictly on the provided documentation context
- Honest when you don't have enough information

If the context doesn't contain relevant information to answer the question, politely say so and suggest what information might be helpful.

Documentation Context:
${context || 'No specific documentation context available.'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: question },
    ];

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error('Failed to generate chat response');
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        answer,
        sources: relevantChunks?.map((chunk: any) => ({
          documentId: chunk.document_id,
          pageNumber: chunk.page_number,
        })) || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});