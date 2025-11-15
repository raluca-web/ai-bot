import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.OPENAI_ASSISTANT_ID;
const threads = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!assistantId) {
      return res.status(500).json({ error: 'Assistant not configured. Run: node setup-openai.js' });
    }

    let threadId = threads.get('default');
    if (!threadId) {
      console.log('Creating new thread...');
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      threads.set('default', threadId);
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
