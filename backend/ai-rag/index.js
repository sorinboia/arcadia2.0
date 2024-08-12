import Yargs from "yargs";
const argv = Yargs(process.argv.slice(2)).argv;


const {
  webPort,
  usersApiHost,
  loginApiHost,
  cashtApiHost,
  stocktApiHost,
  stocksApiHost,
  llmApiHost,
  llmModel,
  llmSecurityHost,
  llmSecurityAppId,
  aiRag
} = argv;


import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';
import { addFileToCollection, addFilesToCollection } from './data_loader.js';
import multer from 'multer';
import fs from 'fs/promises';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = webPort || 3000;

// Define the documents folder path
const docsFolder = path.join(__dirname, 'Docs');
const client = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000"
});
const emb_fn = new DefaultEmbeddingFunction();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

await fillDB();

app.use('/v1/ai-rag', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cors());

app.get('/v1/ai-rag', (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post('/v1/ai-rag/uploadFiles', upload.array('files'), async (req, res) => { 
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send({ message: 'No files were uploaded.' });
    }

    const collection = await getOrCreateCollection("News");
    
    for (const file of files) {
      const filePath = path.join(docsFolder, file.originalname);
      await fs.writeFile(filePath, file.buffer);
      await addFileToCollection(filePath, collection);
    }

    res.send({ message: 'Files added to database successfully' });
  } catch (error) {
    console.error('Error processing uploaded files:', error);
    res.status(500).send({ message: 'Error processing uploaded files' });
  }
});

app.post('/v1/ai-rag/chat', async (req, res) => {
  console.log("query received!");
  const { query } = req.body;
  const collection = await getOrCreateCollection("News");
  const dbres = await queryCollection(collection, 5, [query]);      
  res.send(dbres.documents);
});

async function getOrCreateCollection(name) {
  const collection = await client.getOrCreateCollection({
    name,
    metadata: {
      description: "Private Docs",
      "hnsw:space": "l2" 
    },
    embeddingFunction: emb_fn,
  });
  return collection;
}

async function queryCollection(collection, nResults, queryTexts) {
  const results = await collection.query({
    nResults,
    queryTexts,
  });
  return results;
}

async function fillDB(retryCount = 5, delay = 5000) {
  try {
    const collection = await getOrCreateCollection("News");
    await addFilesToCollection(docsFolder, collection);
    console.log("Documents ingested successfully!");
  } catch (error) {
    console.error("Error filling DB:", error.message);
    if (retryCount > 0) {
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      await fillDB(retryCount - 1, delay);
    } else {
      console.error("Max retries reached. Failed to fill DB.");
    }
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});