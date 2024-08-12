import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import dataLoader from './util/data-loader.js';
import docSplitter from './util/doc-splitter.js';
import vectorizer from './util/vectorizer.js';
import retrievalQAChain from './util/retrieval-qa-chain.js';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var folder = './uploads/';
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API routes
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', fileName: req.file.filename });
});

app.get('/api/embedding-document', async (req, res) => {
    try {
        var filePath = path.resolve(__dirname, "./uploads/" + req.query.document);
        const docs = await dataLoader.load_documents(filePath);
        const splitted_doc = await docSplitter.split_documents(docs);
        await vectorizer.embed_and_store(req.query.document, splitted_doc);
        res.send({ status: "SUCCESS" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "FAILED", message: "An unexpected error occurred during document embedding." });
    }
});

app.get('/api/ask', async (req, res) => {
    console.log('Received question:', req.query.question);
    try {
        const documentID = req.query.document;
        if (!documentID) {
            return res.status(400).send({ status: "FAILED", answer: "Document ID is required." });
        }
        const answer = await retrievalQAChain.ask_question(documentID, req.query.question, []);    
        res.send(answer);
    } catch (error) {
        console.error(error);
        if (error.message.includes("Document not found or not processed yet")) {
            res.status(404).send({ status: "FAILED", answer: error.message });
        } else {
            res.status(500).send({ status: "FAILED", answer: "An unexpected error occurred while processing your question." });
        }
    }
});

// Serve static files after API routes
app.use(express.static('public'));

// Serve the HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});