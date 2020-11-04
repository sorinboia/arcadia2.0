const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;


const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const ARCADIA_DB = `mongodb://${arcadiaDB}/arcadia-db`;
const API_VERSION = 'v1';
const User = require('./models/user');

//Getting user data from external sources
fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/user/:accountId`,
    handler: async (request,reply) => {
        const result = await User.findOne({ accountId : request.params.accountId});
        return result;
    }
});

// Creating a new user
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/user`,
    handler: async (request,reply) => {
        const { name, email, picture, cash, password } = request.body;

        // Generating an account id
        const accountId = Math.floor(Math.random() * (99999999 - 10000000) + 10000000 );

        new User({
            accountId,
            name,
            email,
            picture,
            cash,
            password
        }).save ( function (err) {
            if (err) throw(err);
        });

        return { status: 'success'};
    }
});

// Getting user data from internal sources
fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/user_i/:email`,
    handler: async (request,reply) => {

        const email = (new Buffer(request.params.email,'base64')).toString();
        const result = await User.findOne({ email });
        return result;
    }
});


const start = async () => {
    try {
        await mongoose.connect(ARCADIA_DB);
        fastify.log.info('Connected to DB');

        await fastify.listen(webPort || 3000,'0.0.0.0');
        fastify.log.info(`server listening on ${fastify.server.address().port}`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();