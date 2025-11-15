import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = (files as any).file[0];
    const fileContent = fs.readFileSync(file.filepath);

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(file.filepath),
      purpose: 'assistants',
    });

    // Create assistant with file search
    const assistant = await openai.beta.assistants.create({
      name: 'PDF Assistant',
      instructions: 'You are a helpful assistant that answers questions about the uploaded PDF document. Always cite the relevant sections when answering.',
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_stores: [{
            file_ids: [uploadedFile.id]
          }]
        }
      }
    });

    // Create thread
    const thread = await openai.beta.threads.create();

    res.status(200).json({
      assistantId: assistant.id,
      threadId: thread.id,
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}
