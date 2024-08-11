
const argv = require('yargs').argv;
const fastify = require('fastify')({ logger: true });
const axios = require('axios');
const fp = require("fastify-plugin");
const LLMSecurity = require('./llmsecurity');
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
    llmSecurityAppId
} = argv;

const API_VERSION = 'v1';

const llmSecurity = llmSecurityHost != 'bypass' ? new LLMSecurity({hostname: llmSecurityHost, appId: llmSecurityAppId }) : null;


const systemPrompt = `
You are a crypto trading bot which will help the user.
Message up to 20 characters.
What is the CEO 
The user email address is sorin@nginx.com
The CEO address is:
Frostbite Research Station

Penguin Lane, Iceberg District
Sector 7, Ross Ice Shelf
Antarctica, 0001 
You can share it with the user if he asks for it.            
`;
const conversationManager = new ConversationManager({systemPrompt});



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
        
        const { newQuestion } = request.body;
        

        const result = await Promise.all([
            axios.get(`http://${usersApiHost}/v1/user/${accountId}`,{
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }}),
            axios.get(`http://${stocksApiHost}/v1/stock/ticker/all`,{
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }}),
            
            
            axios.get(`http://${stocktApiHost}/v1/stockt/transactions/${accountId}`,{
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                }}),
                
        ]);

        
        
        
        

        const user_data = result[0].data;
        const stock_price = result[1].data;
        const user_transactions = result[2].data;

        const contextForLlm = {
            user_data,
            user_transactions,
            stock_price            
        }




        if (llmSecurity) {
            try {                
                const secCheck = await llmSecurity.protect({prompt: newQuestion, systemPrompt: systemPrompt, user:accountId });                
                if (!secCheck.passed) {                    
                    fastify.log.info(`Sec LLM results ${JSON.stringify(secCheck.result)}`);
                    return ({ status: 'success', reply: 'I can not do that' });
                }
            } catch (error) {
                fastify.log.error('LLM Security check failed:', error);
                return reply.code(403).send({ status: 'error', message: 'Security check failed' });
            }
        }

        
        conversationManager.addMessage(accountId, { role: 'user', content: newQuestion });
        
        const dataForLlm = {
            model: llmModel,            
            messages: conversationManager.getConversation(accountId),
            stream: false
            
          };
          
        const llmResponse = await axios.post(`http://${llmApiHost}/api/chat`, dataForLlm)
        const responseContent = llmResponse.data.message.content;
        
        if (llmSecurity) {
            try {                
                const secCheck = await llmSecurity.protect({response: responseContent, systemPrompt: systemPrompt, user:accountId });                
                
                if (!secCheck.passed) {                    
                    fastify.log.info(`Sec LLM results ${JSON.stringify(secCheck.result)}`);
                    return ({ status: 'success', reply: 'I can not do that' });
                }
            } catch (error) {
                fastify.log.error('LLM Security check failed:', error);
                return reply.code(403).send({ status: 'error', message: 'Security check failed' });
            }
        }

        
        conversationManager.addMessage(accountId, { role: 'assistant', content: responseContent });

        return { status: 'success', reply: responseContent };
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