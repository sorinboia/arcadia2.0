const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;




const fastify = require('fastify')({ logger: true });
const axios = require('axios');
const jwt = require('njwt');

const API_VERSION = 'v1';
const USER_API = `http://${usersApiHost}/v1`; //`http://users/v1`


// Login flow
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/login`,
    handler: async (request,reply) => {
        const { email, password } = request.body;
        const b64_email = (new Buffer(email)).toString('base64');
        const result = await axios.get(`${USER_API}/user_i/${b64_email}`);

        if (password == result.data.password) {

            const claims = { iss: 'fun-with-jwts', sub: 'AzureDiamond' };
            const token = jwt.create(claims, 'top-secret-phrase');
            token.setExpiration(new Date().getTime() + 60*1000);

            return {
                status: 'success',
                jwt: token.compact()
            }
        } else {
            return { status: 'failed' }
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