import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from './ollama-embeddings.js';

const embed_and_store = async function(vector_store, split_documents) {
    const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large:latest",  // or any other model you prefer
        baseUrl: "http://192.168.0.101:11434"  // adjust if your Ollama instance is on a different URL
    });

    const vectorStore = await FaissStore.fromDocuments(
        split_documents,
        embeddings
    );
    const directory = "./vector-db/faiss-store/" + vector_store;
    await vectorStore.save(directory);
};

export default { embed_and_store };