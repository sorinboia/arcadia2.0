import pdf from 'pdf-parse-fork';
import fs from 'fs';
import path from 'path';
import docx from 'docx-parser';

function chunkText(text) {
  const words = text.split(/\s+/);
  const chunkSize = 100;
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

async function extractTextFromPDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfText = await pdf(dataBuffer);
  return pdfText.text;
}

async function extractTextFromDocx(filePath) {
  return new Promise((resolve, reject) => {
    docx.parseDocx(filePath, function(data) {
      if (data) {
        resolve(data);
      } else {
        reject(new Error("No data returned from parseDocx"));
      }
    });
  });
}

export async function addTextToCollection(text, filePath, collection) {
  console.log(`Ingesting File ${filePath}\n...`);
  const chunks = chunkText(text);
  const fileName = path.basename(filePath);
  const ids = chunks.map((_, index) => `${fileName}_chunk_${index + 1}`);
  const metadatas = chunks.map(() => ({ source: fileName }));

  const result = await collection.add({
    ids,
    metadatas,
    documents: chunks,
  });

  console.log(result);
}

export async function addFileToCollection(filePath, collection) {
  console.log(`Ingesting File ${filePath}\n...`);
  let text;
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    text = await extractTextFromPDF(filePath);
  } else if (ext === '.docx') {
    text = await extractTextFromDocx(filePath);
  } else if (ext === '.txt') {
    text = fs.readFileSync(filePath, 'utf8');
  } else {
    console.log(`Unsupported file type: ${ext}`);
    return;
  }

  const chunks = chunkText(text);
  const fileName = path.basename(filePath);
  const ids = chunks.map((_, index) => `${fileName}_chunk_${index + 1}`);
  const metadatas = chunks.map(() => ({ source: fileName }));

  const result = await collection.add({
    ids,
    metadatas,
    documents: chunks,
  });

  console.log(result);
}

export async function addFilesToCollection(folderPath, collection) {
  const files = fs.readdirSync(folderPath);
  console.log(files);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    await addFileToCollection(filePath, collection);
  }
}