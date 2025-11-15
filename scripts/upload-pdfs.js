import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const PDF_DIR = path.join(__dirname, 'pdfs');

async function uploadPDF(filePath) {
  const filename = path.basename(filePath);
  console.log(`Uploading: ${filename}...`);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/upload-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    console.log(`✓ ${filename} uploaded successfully (${result.document.chunks} chunks)`);
    return result;
  } catch (error) {
    console.error(`✗ ${filename} failed:`, error.message);
    throw error;
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: Missing Supabase credentials in .env file');
    process.exit(1);
  }

  if (!fs.existsSync(PDF_DIR)) {
    console.error(`Error: PDF directory not found: ${PDF_DIR}`);
    console.log('Please create a "scripts/pdfs" folder and add your PDF files there.');
    process.exit(1);
  }

  const files = fs.readdirSync(PDF_DIR)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(PDF_DIR, file));

  if (files.length === 0) {
    console.error('Error: No PDF files found in scripts/pdfs directory');
    process.exit(1);
  }

  console.log(`Found ${files.length} PDF files to upload\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    try {
      await uploadPDF(file);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failCount++;
    }
  }

  console.log(`\nUpload complete:`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
}

main();
