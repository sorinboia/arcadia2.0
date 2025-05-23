
const argv = require('yargs').argv;
const fastify = require('fastify')({ logger: true });
const axios = require('axios');
const fp = require("fastify-plugin");
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const asyncChatTasks = new Map();


const ConversationManager = require('./conversationManager');



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

const API_VERSION = 'v1';





const conversationManager = new ConversationManager({    
    llmApiHost,
    llmModel,
    fastify 
});



const openTracingHeaders = (headers) => {
    const resultHeaders = Object.keys(headers).filter( x => (x.indexOf('x-')  === 0) || (x.indexOf('okta-')  === 0));
    const finalHeaders = {};

    resultHeaders.forEach((head) => {
        finalHeaders[head] = headers[head]
    });
    return finalHeaders;
};

fp(async function(opts) {
    fastify.register(require("fastify-jwt"), {
        secret: "top-secret-phrase"
    });

    fastify.decorate("authenticate", async function(request, reply) {

        if (request.headers['okta-user']) {
            request.user = {
                sub: request.headers['okta-user']
            };
            return
        }

        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })
}) ();

fastify.route({
    method: 'GET',
    url: '/healthz',
    handler: (request,reply) => {
        return 'Ok';
    }
});


fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/ai/conversations`,
    handler: async (request, reply) => {
        const filePath = path.join(__dirname, 'conversations.html');
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        reply.type('text/html').send(htmlContent);
    }
});

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/ai/chat/conversations`,
    handler: async (request, reply) => {
        const conversations = conversationManager.getAllConversations();
        return conversations;
    }
});

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/ai/chat`,
    handler: (request,reply) => {
        return 'Ok';
    }
});

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/ai/chat/reset`,
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
        const authorization = request.headers.authorization;
        let accountId;
        if (request.headers['okta-user']) {
            accountId = (await axios.get(`http://${usersApiHost}/v1/user/email/${request.user.sub}`,{
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }})).data.accountId;
        } else {
            accountId = request.user.sub;
        }
        conversationManager.resetConversation(accountId);
        return { status: 'success', message: 'Conversation reset successfully' };
    }
});

fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/ai/chat/regen`,
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      const authorization = request.headers.authorization;
      let accountId;
      if (request.headers['okta-user']) {
        accountId = (await axios.get(`http://${usersApiHost}/v1/user/email/${request.user.sub}`, {
          headers: {
            authorization,
            ...openTracingHeaders(request.headers)
          }
        })).data.accountId;
      } else {
        accountId = request.user.sub;
      }
  
      // Extract useTools from the body for regeneration, default to false
      const { useTools = false } = request.body || {};
      
      try {
        const jwtToken = authorization.split(' ')[1];
        const responseContent = await conversationManager.regenerateLastResponse(accountId, jwtToken, useTools);
            
        return responseContent;
      } catch (error) {
        fastify.log.error(`Error regenerating last response: ${error}`);
        return reply.code(500).send({ status: 'error', message: 'An error occurred while regenerating the last response' });
      }
    }
  });
  


// Ask AI
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/ai/chat`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {

        const authorization = request.headers.authorization;
        let accountId;
        if (request.headers['okta-user']) {
            accountId = (await axios.get(`http://${usersApiHost}/v1/user/email/${request.user.sub}`,{
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }})).data.accountId;
        } else {
            accountId = request.user.sub;
        }
        
        const { newQuestion, useTools = false } = request.body;
        
        try {

            const jwtToken = authorization.split(' ')[1];
            const responseContent = await conversationManager.processMessage(accountId, newQuestion, 0, jwtToken, false, useTools);            

            return responseContent;
        } catch (error) {
            fastify.log.error(`Error processing message: ${error}` );
            return reply.code(500).send({ status: 'error', message: 'An error occurred while processing your request' });
        }
    }
});
 
// Async AI chat endpoints
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/ai/chat/async`,
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
        const authorization = request.headers.authorization;
        let accountId;
        if (request.headers['okta-user']) {
            accountId = (await axios.get(`http://${usersApiHost}/v1/user/email/${request.user.sub}`, {
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }
            })).data.accountId;
        } else {
            accountId = request.user.sub;
        }
        const { newQuestion, useTools = false } = request.body;
        const requestId = randomUUID();
        asyncChatTasks.set(requestId, { status: 'processing' });
        // Fire and forget processing
        conversationManager.processMessage(accountId, newQuestion, 0, authorization.split(' ')[1], false, useTools)
            .then(result => {
                if (result.status === 'success') {
                    asyncChatTasks.set(requestId, { status: 'completed', reply: result.reply });
                } else {
                    asyncChatTasks.set(requestId, { status: 'error' });
                }
            })
            .catch(error => {
                fastify.log.error(`Async chat error for request ${requestId}: ${error}`);
                asyncChatTasks.set(requestId, { status: 'error' });
            });
        return reply.send({ status: 'accepted', requestId });
    }
});

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/ai/chat/async/:requestId`,
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
        const { requestId } = request.params;
        if (!asyncChatTasks.has(requestId)) {
            return reply.code(404).send({ status: 'error', message: 'Request not found' });
        }
        const task = asyncChatTasks.get(requestId);
        if (task.status === 'completed') {
            return { status: 'completed', reply: task.reply };
        }
        if (task.status === 'error') {
            return { status: 'error' };
        }
        return { status: 'processing' };
    }
});

fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/ai/security-config`,
    
    handler: async (request, reply) => {
        try {
            const { llmSecurityHost, llmSecurityAppId } = request.body; // You may need to validate these inputs.
            await conversationManager.setSecurityConfig({ llmSecurityHost, llmSecurityAppId });
            return reply.send({ status: 'success', message: 'Security configuration updated successfully' });
        } catch (error) {
            fastify.log.error(`Error updating security configuration: ${error}`);
            return reply.code(500).send({ status: 'error', message: 'An error occurred while updating the security configuration' });
        }
    }
});



const start = async () => {
    try {    
        await fastify.listen(webPort || 3000,'0.0.0.0');
        fastify.log.info(`server listening on ${fastify.server.address().port}`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();
