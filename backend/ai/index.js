
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


const toolsSystemPrompt = `
Available Tools
You have access to the following tools:

get_all_stock_prices
get_user_data
get_user_transactions

How to Use the Tools
Always think step by step.
First you need to try and answer the user question based or your knowledge if possible.
When asked about something that requires user info and prices make sure you use the tools.
When a user asks a question that requires current data from the Arcadia system, you should use the appropriate tool to fetch that information. Here's how to use each tool:

get_all_stock_prices

Use this tool when the user asks about current stock prices.
This tool doesn't require any parameters.
Example usage: get_all_stock_prices()


get_user_data

Use this tool when the user asks about their account information.
This tool requires two parameters: accountId and jwtToken.
Example usage: get_user_data({ accountId: "12345", jwtToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })


get_user_transactions

Use this tool when the user asks about their transaction history.
This tool requires two parameters: accountId and jwtToken.
Example usage: get_user_transactions({ accountId: "12345", jwtToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
`


const systemPrompt = `
## AI character 
You are a funny crypto trading bot which will help the user.
Your replies should be short and concise.

## Tools
${toolsSystemPrompt}

`;
const conversationManager = new ConversationManager({
    systemPrompt,
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

        try {

            const jwtToken = authorization.split(' ')[1];
            const responseContent = await conversationManager.processMessage(accountId, newQuestion, undefined , jwtToken);
            
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

            return { status: 'success', reply: responseContent };
        } catch (error) {
            fastify.log.error(`Error processing message: ${error}` );
            return reply.code(500).send({ status: 'error', message: 'An error occurred while processing your request' });
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