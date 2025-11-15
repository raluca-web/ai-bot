# PDF Chatbot Setup Guide

## 1. Remove Upload from Frontend (DONE)

The upload functionality has been removed from the frontend. Users will only see the chat interface.

## 2. Upload Your PDFs

### Step 1: Create the PDF folder
```bash
mkdir -p scripts/pdfs
```

### Step 2: Add your PDF files
Place all 100-200 PDF files into the `scripts/pdfs` folder.

### Step 3: Install dependencies
```bash
npm install
```

### Step 4: Configure Supabase Edge Functions
Before uploading, you need to add your OpenAI API key to Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **Secrets**
4. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

### Step 5: Upload all PDFs
```bash
npm run upload-pdfs
```

This will:
- Process each PDF file
- Extract text content
- Generate embeddings
- Store everything in your Supabase database
- Show progress for each file

The upload happens once. After that, all documents are permanently stored in your database.

## 3. Customize Bot Behavior

### Option A: Modify the System Prompt

Edit `supabase/functions/ai-chat/index.ts` at line 100-109:

```typescript
const systemPrompt = `You are a helpful AI assistant that answers questions based on software documentation. Your responses should be:
- Clear and conversational, like talking to a human
- Helpful and informative
- Based strictly on the provided documentation context
- Honest when you don't have enough information

If the context doesn't contain relevant information to answer the question, politely say so and suggest what information might be helpful.

Documentation Context:
${context || 'No specific documentation context available.'}`;
```

**Examples of customizations:**

**For a product support bot:**
```typescript
const systemPrompt = `You are a customer support assistant for [PRODUCT NAME]. Your responses should be:
- Professional and friendly
- Focus on solving customer problems
- Provide step-by-step instructions when needed
- Reference specific documentation sections when available

Always be patient and helpful. If you don't have the answer in the documentation, guide the customer to contact support.

Documentation Context:
${context}`;
```

**For a technical documentation bot:**
```typescript
const systemPrompt = `You are a technical documentation assistant. Your responses should be:
- Precise and technically accurate
- Include code examples when relevant
- Reference specific API methods or functions
- Explain technical concepts clearly

Only answer based on the provided documentation. Do not make assumptions about undocumented features.

Documentation Context:
${context}`;
```

**For a company knowledge base bot:**
```typescript
const systemPrompt = `You are [COMPANY NAME]'s internal knowledge assistant. Your responses should be:
- Based on company policies and procedures
- Clear and concise for employee understanding
- Reference specific policy documents when applicable
- Maintain professional tone

If information is not in the knowledge base, suggest who the employee should contact.

Documentation Context:
${context}`;
```

### Option B: Adjust Search Parameters

Edit line 69-76 in `supabase/functions/ai-chat/index.ts`:

```typescript
const { data: relevantChunks, error: searchError } = await supabase.rpc(
  'search_documents',
  {
    query_embedding: questionEmbedding,
    match_threshold: 0.7,  // Lower = more results (try 0.5-0.8)
    match_count: 5,        // Number of chunks to retrieve (try 3-10)
  }
);
```

- **match_threshold**: Lower values (0.5) return more results but may be less relevant. Higher values (0.8) are more strict.
- **match_count**: How many document chunks to use as context. More chunks = more context but slower.

### Option C: Change AI Model

Edit line 124 in `supabase/functions/ai-chat/index.ts`:

```typescript
model: 'gpt-4o-mini',  // Options: 'gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'
```

- `gpt-4o-mini`: Fast and cheap, good for most use cases
- `gpt-3.5-turbo`: Faster and cheaper, slightly less capable
- `gpt-4`: More intelligent, slower and more expensive

### Option D: Adjust Response Style

Edit line 126-127 in `supabase/functions/ai-chat/index.ts`:

```typescript
temperature: 0.7,     // 0 = focused/deterministic, 1 = creative/varied
max_tokens: 1000,     // Maximum response length
```

## 4. Deploy Changes

After making any customization:

1. **Redeploy the edge function:**
   The ai-chat function is already deployed. If you modify it, it will auto-update on next deployment.

2. **Build and deploy your frontend:**
   ```bash
   npm run build
   ```

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure chatbot"
   git push
   ```

Your hosting platform (Netlify/Vercel) will automatically deploy the changes.

## 5. Testing

Test your bot by:
1. Running locally: `npm run dev`
2. Asking questions about your PDF content
3. Verifying the bot responds with information from your documents

## Folder Structure

```
project/
├── scripts/
│   ├── pdfs/              # Put your 100-200 PDFs here
│   └── upload-pdfs.js     # Script to upload all PDFs
├── supabase/
│   └── functions/
│       ├── ai-chat/       # Modify this to customize bot behavior
│       └── upload-document/
└── src/
    └── components/
        └── ChatInterface.tsx  # The only UI your users see
```

## Important Notes

1. **One-time upload**: PDFs only need to be uploaded once. They're stored permanently in Supabase.
2. **No frontend upload**: Users cannot upload files through the website.
3. **Bot customization**: All behavior changes are in `supabase/functions/ai-chat/index.ts`
4. **Cost**: You'll pay for OpenAI API usage (embeddings + chat completions) based on usage.
