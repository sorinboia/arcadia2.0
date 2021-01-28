const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;




const fastify = require('fastify')({ logger: true });
fastify.register(require('fastify-cors'), {
    origin: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH']
});

const fp = require("fastify-plugin");

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




const axios = require('axios');
const jwt = require('njwt');

const API_VERSION = 'v1';
const USER_API = `http://${usersApiHost}/v1`; //`http://users/v1`


const openTracingHeaders = (headers) => {
    const resultHeaders = Object.keys(headers).filter( x => (x.indexOf('x-')  === 0) || (x.indexOf('okta-')  === 0));
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
            return { status: 'fail', msg:'Bad credentials' }
        }

    }
});


fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/login/deviceid`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {

        const authorization = request.headers.authorization;
        const email = request.user.sub;
        const cookies = request.headers.cookie.split(';');

        let deviceIdCookie = null;

        cookies.forEach((cookie) => {
           cookieArr = cookie.trim().split('=');
           if (cookieArr[0] == '_imp_apg_r_') deviceIdCookie = cookieArr[1]
        });

        const b64_email = (new Buffer(email)).toString('base64');
        const result = await axios.get(`${USER_API}/user_i/${b64_email}`,{
            authorization,
            headers: openTracingHeaders(request.headers)
        });

        if (!result.data) return { status: 'fail' };

        const  { accountId, deviceId } = result.data;

        request.log.info('\r\n***************************************\r\n');
        request.log.info('deviceId',deviceId);
        request.log.info('Cookie deviceId',deviceId);
        request.log.info('\r\n***************************************\r\n');


        if (!deviceId) {

            await axios({
                method: 'PATCH',
                url: `http://${usersApiHost}/v1/user`,
                headers: {
                    authorization,
                    ...openTracingHeaders(request.headers)
                },
                data: {
                    accountId,
                    deviceId: deviceIdCookie
                }
            });

            return {status:'success', msg: 'first time login'}
        } else if (deviceId == deviceIdCookie) {
            return {status:'success'}
        } else {
            return {status:'fail', msg: 'Device id not valid',deviceId,deviceIdCookie}
        }

    }
});




const start = async () => {
    try {
        await fastify.listen(webPort || 3001,'0.0.0.0');
        fastify.log.info(`server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();