const argv = require('yargs').argv;


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost, stocksApiHost, llmApiHost } = argv;


const fastify = require('fastify')({ logger: true });
const axios = require('axios');

const API_VERSION = 'v1';


const fp = require("fastify-plugin");





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
        
        const { conversation, newQuestion } = request.body;
        
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
            stock_price,
            conversation
        }

        const dataForLlm = {
            model: "llama3:8b",
            system: `
            You are a crypto trading bot which will help the user.
            Message up to 20 characters. 
            Bellow you have a abject in a JSON format it has the following parameters: user_data, user_transactions, stock_price, conversation.
            conversation - holds the previous messages in the conversation with the user.
            user_data - information about how much cash and crypto curency the user has.
            user_transactions - Previoulsy buy or sell order of the user
            stock_price - the crypto stock prices at the moment.

            Here is the data:
            ${JSON.stringify(contextForLlm)}
            `,
            prompt: newQuestion,
            stream: false
          };
          
        const llmResponse = await axios.post(`http://${llmApiHost}/api/generate`, dataForLlm)
                       
        return { status: 'success', reply: llmResponse.data.response };
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