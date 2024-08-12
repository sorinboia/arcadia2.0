import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { OllamaEmbeddings } from './ollama-embeddings.js';
import { ChatOllama } from "langchain/chat_models/ollama";
import fs from 'fs';
import path from 'path';

const ask_question = async function(document_id, question, chat_history = []) {
    const directory = path.join("./vector-db/faiss-store", document_id);
    
    // Check if the directory exists
    if (!fs.existsSync(directory)) {
        throw new Error("Document not found or not processed yet. Please upload and process the document first.");
    }

    const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large:latest",  // or any other model you prefer
        baseUrl: "http://192.168.0.101:11434"  // adjust if your Ollama instance is on a different URL
    });
    
    const model = new ChatOllama({
        baseUrl: "http://192.168.0.101:11434",  // adjust if your Ollama instance is on a different URL
        model: "llama3.1:8b",  // or any other model you prefer
    });
    
    try {
        const loadedVectorStore = await FaissStore.load(
            directory,
            embeddings
        );

        const chain = ConversationalRetrievalQAChain.fromLLM(
            model,
            loadedVectorStore.asRetriever(),
            {
                returnSourceDocuments: true,
            }
        );

        const response = await chain.invoke({ question: question, chat_history: chat_history });

        const history = new ChatMessageHistory();
        await history.addMessage(new HumanMessage(question));
        await history.addMessage(new AIMessage(response.text));

        chat_history.push(history.messages[0]);
        chat_history.push(history.messages[1]);

        const answer = {
            answer: response.text,
            chat_history: chat_history,
            source: response.sourceDocuments
        };

        return answer;
    } catch (error) {
        console.error("Error in ask_question:", error);
        throw error;
    }
};

export default { ask_question };