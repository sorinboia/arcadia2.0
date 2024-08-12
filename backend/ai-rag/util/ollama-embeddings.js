import { Embeddings } from "langchain/embeddings/base";
import axios from 'axios';

export class OllamaEmbeddings extends Embeddings {
  constructor(config) {
    super(config);
    this.model = config.model || "mxbai-embed-large:latest";
    this.baseUrl = config.baseUrl || "http://192.168.0.101:11434";
  }

  async embed(texts) {
    const embeddings = await Promise.all(
      texts.map((text) => this.embeddingWithRetry(text))
    );
    return embeddings;
  }

  async embeddingWithRetry(text, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
          model: this.model,
          prompt: text,
        });
        return response.data.embedding;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async embedQuery(text) {
    return this.embeddingWithRetry(text);
  }

  async embedDocuments(documents) {
    return this.embed(documents);
  }
}