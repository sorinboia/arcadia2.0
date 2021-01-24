const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;




const fastify = require('fastify')({ logger: true });
const oas = require('fastify-oas');
fastify.register(oas,{
        routePrefix: '/documentation',
        swagger: {
            info: {
                title: 'Test openapi',
                description: 'testing the fastify swagger api',
                version: '0.1.0',
            },
            externalDocs: {
                url: 'https://swagger.io',
                description: 'Find more info here',
            },
            consumes: ['application/json'],
            produces: ['application/json'],
        },
        exposeRoute: true
    }
);





const axios = require('axios');
const jwt = require('njwt');

const API_VERSION = 'v1';
const USER_API = `http://${usersApiHost}/v1`; //`http://users/v1`


const openTracingHeaders = (headers) => {
    const resultHeaders = Object.keys(headers).filter( x => x.indexOf('x-')  === 0);
    const finalHeaders = {};

    resultHeaders.forEach((head) => {
        finalHeaders[head] = headers[head]
    });
    return finalHeaders;
};






// Login flow
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/login`,
    schema: {
        body: {
          type: 'object',
          properties: {
              email: {type: 'string'},
              password: {type:'string'}
          }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    accountId: { type: 'number' },
                    name: { type: 'string' },
                    cash:  { type: 'number' },
                    stocks:  { type: 'object' },
                    jwt:  { type: 'string' },
                }
            }
        }
    },
    handler: async (request,reply) => {



        const { email, password } = request.body;
        const b64_email = (new Buffer(email)).toString('base64');
        const result = await axios.get(`${USER_API}/user_i/${b64_email}`,{
            headers: openTracingHeaders(request.headers)
        });

        if (!result.data) return { status: 'fail' };

        const  { accountId, name, cash, stocks, picture } = result.data;

        if (password == result.data.password) {

            const claims = { iss: 'arcadia-jwt', sub: accountId };
            const token = jwt.create(claims, 'top-secret-phrase');
            token.setExpiration(new Date().getTime() + 6000 *9000000);

            return {
                status: 'success',
                accountId,
                name,
                cash,
                stocks,
                picture,
                jwt: token.compact()
            }
        } else {
            return { status: 'fail' }
        }

    }
});




const start = async () => {
    try {
        await fastify.listen(webPort || 3001,'0.0.0.0');
        fastify.log.info(`server listening on ${fastify.server.address().port}`);
        fastify.oas();
    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();