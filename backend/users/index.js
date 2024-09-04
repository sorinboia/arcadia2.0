const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;


const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');


const ARCADIA_DB = `mongodb://${arcadiaDB}/arcadia-db`;
const API_VERSION = 'v1';
const User = require('./models/user');


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

fastify.route({
    method: 'GET',
    url: '/healthz',
    handler: (request,reply) => {
        return 'Ok';
    }
});



//Getting user data from external sources
fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/user/:accountId`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {
        
        const  { accountId, email, name, cash, stocks } = await User.findOne({ accountId : request.params.accountId});

        return { status: 'success',accountId, email, name, cash, stocks };
    }
});

// Creating a new user
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/user`,
    handler: async (request,reply) => {
        const { name, email, picture, cash, password,stocks } = request.body;
        const accountId = Math.floor(Math.random() * (99999999 - 10000000) + 10000000 );
        // Generating an account id
        new User({
            accountId,
            name,
            email,
            picture,
            cash,
            password,
            stocks
        }).save ( function (err) {
            if (err) throw(err);
        });

        return { status: 'success'};

    }
});

fastify.route({
    method: 'PATCH',
    url: `/${API_VERSION}/user`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {
        let accountId;

        if (request.headers['okta-user']) {
            const result = await User.findOne({ email: request.user.sub });
            accountId = result.accountId;
        } else {
            accountId = request.user.sub;
        }

        const { name, email, picture, cash, password,stocks } = request.body;
        const user = await User.findOne({ accountId });
        user.name = name || user.name;
        user.email  = email || user.email;
        user.picture  = picture || user.picture;
        user.cash  = cash || user.cash;
        user.password  = password || user.password;
        user.stocks  = stocks || user.stocks;

        user.save ( function (err) {
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


// Get account from email

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/user/email/:email`,
    handler: async (request,reply) => {
        const email = request.params.email;

        const result = await User.findOne({ email });
        fastify.log.info(`Email ${email} Result ${result}`);
        return {accountId:result.accountId};
    }
});


const start = async () => {
    try {
        await mongoose.connect(ARCADIA_DB);
        fastify.log.info('Connected to DB',ARCADIA_DB);

        await fastify.listen(webPort || 3000,'0.0.0.0');
        fastify.log.info(`server listening on ${fastify.server.address().port}`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1)
    }
};
start();