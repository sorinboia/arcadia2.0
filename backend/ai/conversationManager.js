// conversationManager.js

const axios = require('axios');

axios.defaults.validateStatus = function (status) {
    return (status >= 200 && status < 300) || 
           status === 422 
};

const tools = require('./tools');
const argv = require('yargs').argv;
const { systemPrompt } = require('./systemPrompt');
const LLMSecurity = require('./llmsecurity');


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


/**
 * Strip out any &lt;think&gt;...&lt;/think&gt; blocks from the given text.
 * Ensures internal reasoning is never saved or exposed.
 * @param {string} text
 * @returns {string}
 */
function removeThinkTags(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    // Non-greedy, multi-line, case-insensitive replace
    // Matches <think> ... </think> including line breaks and removes them
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}
class ConversationManager {
    constructor({ llmApiHost, llmModel, fastify }) {
        this.systemPrompt = systemPrompt;
        this.conversations = new Map();
        this.llmApiHost = llmApiHost;
        this.llmModel = llmModel;
        this.log = fastify.log;
         
        this.llmSecurity = null;
    }

    async setSecurityConfig({ llmSecurityHost, llmSecurityAppId }) {
        if ( llmSecurityHost && llmSecurityAppId ) {
            this.llmSecurity = new LLMSecurity({hostname: llmSecurityHost, appId: llmSecurityAppId});
            return ({ status: 'success', message: 'AI Security enabled' });
        } else {
            return ({ status: 'error', message: 'Credentials not provided' });
        }
    }

    getAllConversations() {
        this.log.info('Retrieving all conversations');
        return Object.fromEntries(this.conversations);
    }

    getConversation(accountId) {
        if (!this.conversations.has(accountId)) {
            this.conversations.set(accountId, []);
            this.log.info(`New conversation started for account ${accountId}`);
        }
        return this.conversations.get(accountId);
    }

    addMessage(accountId, message, jwtToken, ragData) {        
        const conversation = this.getConversation(accountId);
        
        const userSystemPrompt = this.systemPrompt + '\n' +
            '## User info and API Keys\n' +
            'User Account ID:'+ accountId + '\n' +
            'JWT Token Base64 format:'+ jwtToken + '\n\n' 
            

        if (conversation.length === 0) {                                    
            conversation.push({role:'system', content: userSystemPrompt});
            this.log.info(`System prompt added for account ${accountId}`);
        } 
        if ( ragData) {
            conversation[0] = {
                role:'system',
                content: userSystemPrompt + '\n' +
                '## The bellow part enclosed in @@@ has been retirved from a RAG system use it only if you need it\n' +
                '@@@\n' + 
                ragData +
                '\n@@@'
            }

        }
        this.log.info(`Adding message ${JSON.stringify(message)}`);
        conversation.push(message);
                    
    }

    resetConversation(accountId) {
        this.conversations.set(accountId, []);
        this.log.info(`Conversation reset for account ${accountId}`);
    }

    getAllConversations() {
        this.log.info('Retrieving all conversations');
        return Object.fromEntries(this.conversations);
    }

    async processMessage(accountId, newQuestion, depth = 0, jwtToken, regen = false, useTools = false) {
        
        let userSystemPrompt = this.systemPrompt + '\n' +
           '## User info and API Keys\n' +
           'User Account ID:'+ accountId + '\n' +
           'JWT Token Base64 format:'+ jwtToken           

        if (depth > 5) {
            this.log.warn(`Maximum call depth reached for account ${accountId}. Stopping recursion.`);
            return ({ status: 'success', message: 'Endless function calling, rephrase your message.' });
        }

        this.log.info(`Processing message for account ${accountId} at depth ${depth}: ${newQuestion}`);
        if (depth === 0) {    
            
        
            // if (regen) {
            //     newQuestion = newQuestion.split('User question: ')[1].trim();
            // } 
            
            const ragData = await queryAiRag(newQuestion);

            userSystemPrompt = userSystemPrompt + '\n' +
                '## The bellow part enclosed in @@@ has been retirved from a RAG system use it only if you need it\n' +
                '@@@\n' + 
                ragData +
                '\n@@@'
                                      
            

            this.addMessage( accountId, { role: 'user', content: newQuestion }, jwtToken ,ragData );

            
            if (this.llmSecurity) {
                try { 
                                   
                    const secCheck = await this.llmSecurity.protect({prompt: newQuestion, systemPrompt: userSystemPrompt, user:accountId });                
                    this.log.info(`Prompt security check result ${JSON.stringify(secCheck)}`)
                    if (!secCheck.passed) {                    
                        this.log.info(`Sec LLM results ${JSON.stringify(secCheck.result)}`);
                        return ({ status: 'success', reply: 'Prompt security check failed' });
                    }
                } catch (error) {
                    this.log.error('LLM Security check failed:', error);
                    return ({ status: 'error', message: 'Issue to verify security' });
                }
            }

        }  
            
        
                    
        const dataForLlm = {          
            messages: this.getConversation(accountId),
            stream: false,
        };

        // Conditionally add the model property if it's not 'none' or empty
        if (this.llmModel && this.llmModel.toLowerCase() !== 'none' && this.llmModel !== '') {
            dataForLlm.model = this.llmModel;
        }

        if (useTools) {
            dataForLlm.tools = tools.map(({ name, description, parameters }) => ({ name, description, parameters }));
            this.log.info(`Tools included in LLM request for account ${accountId}`);
        } else {
            this.log.info(`Tools NOT included in LLM request for account ${accountId}`);
        }
        
        
        
        this.log.info(`Sending request to LLM API for account ${accountId}`);
        const llmResponse = await axios.post(`http://${this.llmApiHost}/api/chat`, dataForLlm);
        const responseMessage = llmResponse.data.message || llmResponse.data.choices[0].message;        
        // This part verify that the AI Gateway has not failed the request.
        if (llmResponse.status == 422) {
            this.log.info(`AIGW security check failed ${JSON.stringify(responseMessage)}`);
            return ({ status: 'success', reply: 'Security check failed.', reason: responseMessage });
        }

        

        if (useTools && responseMessage.tool_calls) {
            this.log.info(`Function call(s) detected for account ${accountId} tool calls ${JSON.stringify(responseMessage.tool_calls)}`);
            for (const toolCall of responseMessage.tool_calls) {
                
                const tool = tools.find(t => t.name === toolCall.function.name);

                this.addMessage(accountId, {
                    role: 'assistant',
                    content: '',
                    tool_calls: [ toolCall.function ]
                });
                
                
                if (tool) {
                    this.log.info(`Executing function ${toolCall.function.name} for account ${accountId}`);
                                        
                    const result = await tool.function(toolCall.function.arguments);
                    this.log.info(`Function response ${toolCall.function.name} is ${JSON.stringify(result)}`);
                    this.addMessage(accountId, {
                        role: 'tool',
                        content: JSON.stringify(result),
                        tool_call_id: toolCall.function.name
                    });
                    this.log.info(`Function ${toolCall.function.name} executed for account ${accountId} with data -> ${JSON.stringify(result)}`);
                } else {
                    this.log.info(`Calling non existing tool ${JSON.stringify(toolCall)}`);
                    this.addMessage(accountId, {
                        role: 'tool',
                        content: 'The tool you are calling does not exist',
                        tool_call_id: toolCall.function.name
                    });
                }
            }

            this.log.info(`Recursively calling processMessage for account ${accountId}`);
            return this.processMessage(accountId, "", depth + 1, jwtToken, false, useTools);
        } else {

            if (this.llmSecurity) {
                try {                
                    const secCheck = await this.llmSecurity.protect({response: responseMessage.content, systemPrompt: userSystemPrompt, user:accountId });                
                    this.log.info(`Response security check result ${JSON.stringify(secCheck)}`)
                    if (!secCheck.passed) {                    
                        this.log.info(`Sec LLM results ${JSON.stringify(secCheck.result)}`);
                        return ({ status: 'success', reply: 'Response security check failed.' });
                    }
                } catch (error) {
                    this.log.error('LLM Security check failed:', error);
                    return reply.code(403).send({ status: 'error', message: 'Issue to verify security' });
                }
            }

            this.log.info(`Adding assistant response for account ${accountId}`);
            const cleanContent = removeThinkTags(responseMessage.content);
            this.addMessage(accountId, { role: 'assistant', content: cleanContent });
            return ({ status: 'success', reply: cleanContent });
            
        }
    }

    async regenerateLastResponse(accountId, jwtToken, useTools = false) {
        const conversation = this.getConversation(accountId);
        
        if (conversation.length < 2) {
            throw new Error('Not enough messages to regenerate');
        }
    
    
        // Remove all 'tool' and 'assistant 'messages until we reach a 'user' message
        while (conversation.length > 0 && conversation[conversation.length - 1].role !== 'user') {
            conversation.pop();
        }            

        if (conversation.length === 0) {
            throw new Error('No user message found to regenerate from');
        }
    
        // Get the last user message
        const lastUserMessage = conversation[conversation.length - 1].content;
        conversation.pop();
        // Process the message again
        return this.processMessage(accountId, lastUserMessage, 0, jwtToken, true, useTools);
    }
    
      
}

module.exports = ConversationManager;
