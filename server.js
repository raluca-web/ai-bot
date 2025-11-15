import express from 'express';
import formidable from 'formidable';
import cors from 'cors';
import fs from 'fs';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/setup-assistant', async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: err.message });
      }

      try {
        const fileArray = files.file;
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        console.log('Uploading file to OpenAI...');
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(file.filepath),
          purpose: 'assistants',
        });

        console.log('Creating vector store...');
        const vectorStore = await openai.beta.vectorStores.create({
          name: 'PDF Documents',
          file_ids: [uploadedFile.id],
        });

        console.log('Creating assistant...');
        const assistant = await openai.beta.assistants.create({
          name: 'PDF Assistant',
          instructions: 'You are a helpful assistant that answers questions about the uploaded PDF document. Always provide detailed answers based on the document content.',
          model: 'gpt-4o',
          tools: [{ type: 'file_search' }],
          tool_resources: {
            file_search: {
              vector_store_ids: [vectorStore.id]
            }
          }
        });

        console.log('Creating thread...');
        const thread = await openai.beta.threads.create();

        res.json({
          assistantId: assistant.id,
          threadId: thread.id,
        });
      } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, threadId, assistantId } = req.body;

    if (!message || !threadId || !assistantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      const response = lastMessage.content[0].type === 'text'
        ? lastMessage.content[0].text.value
        : 'Unable to get response';

      res.json({ response });
    } else {
      res.status(500).json({ error: `Run status: ${run.status}` });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
