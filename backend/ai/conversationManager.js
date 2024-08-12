// conversationManager.js

const axios = require('axios');
const tools = require('./tools');
const argv = require('yargs').argv;

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

async function queryAiRag(query) {
    try {
      const response = await axios.post(`http://${aiRag}/v1/ai-rag/chat`, {
        query: query
      });
  
      // Deconstruct the response into a string
      const responseData = response.data[0];
      const deconstructedString = responseData.join('\n');
  
      return deconstructedString;
    } catch (error) {
      console.error('Error querying AI RAG:', error);
      throw error;
    }
  }


class ConversationManager {
    constructor({ systemPrompt, llmApiHost, llmModel, fastify }) {
        this.systemPrompt = systemPrompt;
        this.conversations = new Map();
        this.llmApiHost = llmApiHost;
        this.llmModel = llmModel;
        this.log = fastify.log;
    }

    getConversation(accountId) {
        if (!this.conversations.has(accountId)) {
            this.conversations.set(accountId, []);
            this.log.info(`New conversation started for account ${accountId}`);
        }
        return this.conversations.get(accountId);
    }

    addMessage(accountId, message, jwtToken) {
        const { role, content } = message;
        const conversation = this.getConversation(accountId);
        
        if (conversation.length === 0) {            
                        
            const userSystemPrompt = this.systemPrompt + `
            ## User info and API Keys
            User Account ID: ${accountId}
            JWT Token Base64 format: ${jwtToken}
            `
            conversation.push({role:'system', content: userSystemPrompt});
            this.log.info(`System prompt added for account ${accountId}`);
        }
        
        
        if ( role == 'user') {
            queryAiRag(content).then(ragResult => {
                message.content = `
                ## The bellow part enclosed in @@@ has been retirved from a RAG system use it only if you need it
                @@@
                ${ragResult}
                @@@
                ` + content;
            }) 
            conversation.push(message);
            this.log.info(`Message and RAG added to conversation for account ${accountId}: ${JSON.stringify(message)}`);
        } else {
            conversation.push(message);
            this.log.info(`Message added to conversation for account ${accountId}: ${JSON.stringify(message)}`);
        }
        
        
    }

    resetConversation(accountId) {
        this.conversations.set(accountId, []);
        this.log.info(`Conversation reset for account ${accountId}`);
    }

    getAllConversations() {
        this.log.info('Retrieving all conversations');
        return Object.fromEntries(this.conversations);
    }

    async processMessage(accountId, newQuestion, depth = 0, jwtToken) {
        if (depth > 5) {
            this.log.warn(`Maximum call depth reached for account ${accountId}. Stopping recursion.`);
            return "I apologize, but I'm having trouble processing your request. Could you please rephrase your question?";
        }

        this.log.info(`Processing message for account ${accountId} at depth ${depth}: ${newQuestion}`);
        if (depth === 0) {            
            this.addMessage(accountId, { role: 'user', content: newQuestion }, jwtToken);
        }
        
        const dataForLlm = {
            model: this.llmModel,            
            messages: this.getConversation(accountId),
            stream: false,
            tools: tools.map(({ name, description, parameters }) => ({ name, description, parameters }))
        };
        
        
        
        this.log.info(`Sending request to LLM API for account ${accountId}`);
        const llmResponse = await axios.post(`http://${this.llmApiHost}/api/chat`, dataForLlm);
        const responseMessage = llmResponse.data.message;

        if (responseMessage.tool_calls) {
            this.log.info(`Function call(s) detected for account ${accountId}`);
            for (const toolCall of responseMessage.tool_calls) {
                const tool = tools.find(t => t.name === toolCall.function.name);

                if (tool) {
                    this.log.info(`Executing function ${toolCall.function.name} for account ${accountId}`);
                    const result = await tool.function(toolCall.function.arguments);
                    this.addMessage(accountId, {
                        role: 'tool',
                        content: JSON.stringify(result),
                        tool_call_id: toolCall.function.name
                    });
                    this.log.info(`Function ${toolCall.function.name} executed for account ${accountId} with data -> ${JSON.stringify(result)}`);
                }
            }

            this.log.info(`Recursively calling processMessage for account ${accountId}`);
            return this.processMessage(accountId, "", depth + 1);
        } else {
            this.log.info(`Adding assistant response for account ${accountId}`);
            this.addMessage(accountId, { role: 'assistant', content: responseMessage.content });
            return responseMessage.content;
        }
    }
}

module.exports = ConversationManager;