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
      instructions: 'You are a helpful assistant that answers questions about DeepCharts. Use the uploaded file to answer questions.',
      model: 'gpt-4o',
    });
    console.log('Assistant created:', assistant.id);

    console.log('\n=== SETUP COMPLETE ===');
    console.log('Add these to your .env file:');
    console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
    console.log(`OPENAI_FILE_ID=${file.id}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setup();
