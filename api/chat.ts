import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, threadId, assistantId } = req.body;

    if (!message || !threadId || !assistantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fileId = process.env.OPENAI_FILE_ID;

    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
      attachments: fileId ? [{ file_id: fileId, tools: [{ type: 'file_search' }] }] : undefined,
    });

    // Run assistant
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      const response = lastMessage.content[0].type === 'text'
        ? lastMessage.content[0].text.value
        : 'Unable to get response';

      res.status(200).json({ response });
    } else {
      res.status(500).json({ error: `Run status: ${run.status}` });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
}
