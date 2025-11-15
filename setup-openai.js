import OpenAI from 'openai';
import fs from 'fs';
import 'dotenv/config';

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

    console.log('Creating vector store...');
    const vectorStore = await openai.beta.vectorStores.create({
      name: 'DeepCharts Knowledge Base',
      file_ids: [file.id],
    });
    console.log('Vector store created:', vectorStore.id);

    console.log('Creating assistant...');
    const assistant = await openai.beta.assistants.create({
      name: 'DeepCharts Assistant',
      instructions: 'You are a helpful assistant that answers questions about DeepCharts. Answer based on the FAQ guide provided.',
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
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
