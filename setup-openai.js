import OpenAI from 'openai';
import fs from 'fs';
import { File as NodeFile } from 'node:buffer';
import 'dotenv/config';

globalThis.File = NodeFile;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function setup() {
  try {
    console.log('Uploading PDF to OpenAI...');
    const file = await openai.files.create({
      file: fs.createReadStream('./scripts/pdfs/DeepCharts FAQ Guide (2).pdf'),
      purpose: 'assistants',
    });
    console.log('File uploaded:', file.id);

    console.log('Creating assistant...');
    const assistant = await openai.beta.assistants.create({
      name: 'DeepCharts Assistant',
      instructions: 'You are a helpful assistant that answers questions about DeepCharts. Answer based on the FAQ guide provided.',
      model: 'gpt-4-turbo-preview',
      tools: [{ type: 'retrieval' }],
      file_ids: [file.id]
    });
    console.log('Assistant created:', assistant.id);

    console.log('\n=== SETUP COMPLETE ===');
    console.log('Add this to your .env file:');
    console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setup();
