const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';

const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;


const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const axios = require('axios');

const ARCADIA_DB = `mongodb://${arcadiaDB}/arcadia-db`;
const API_VERSION = 'v1';
const CashTransaction = require('./models/cash_transaction');

const fp = require("fastify-plugin");

fp(async function(opts) {
    fastify.register(require("fastify-jwt"), {
        secret: "top-secret-phrase"
    });

    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })
}) ();




//Getting user data from external sources
fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/casht/transactions/:accountId`,
    handler: async (request,reply) => {

        const { accountId } = request.params.accountId;

        const result = await CashTransaction.find({$or:[{fromAccountId: accountId},{to: accountId}]});
        return result;
    }
});

fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/casht`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {
        const { fromAccountId, toAccountId, amount } = request.body;
        const authorization = request.headers.authorization;
        const users = (await Promise.all([
                axios.get(`http://${usersApiHost}/v1/user/${fromAccountId}`,{
                    headers: {
                    authorization
                }}),
                axios.get(`http://${usersApiHost}/v1/user/${toAccountId}`,{
                    headers: {
                        authorization
                }})
            ])).map( x => x.data );

        if (!fromAccountId || !toAccountId) return { status: 'error', reason: 'One of the account were not found', fromAccountId, toAccountId, amount};
        if (users[0].cash <  amount) return { status: 'fail', reason: 'Not enough balance', fromAccountId, toAccountId, amount};


        await Promise.all([
            axios({
                method: 'PATCH',
                url: `http://${usersApiHost}/v1/user`,
                headers: {
                    authorization
                },
                data: {
                    accountId: fromAccountId,
                    cash: users[0].cash - amount
                }
            }),
            axios({
                method: 'PATCH',
                url: `http://${usersApiHost}/v1/user`,
                headers: {
                    authorization
                },
                data: {
                    accountId: toAccountId,
                    cash: users[1].cash + amount
                }
            })
        ]);


        // Generating an random transaction id
        const transactionId = Math.floor(Math.random() * (9999999999 - 1000000000) + 1000000000 );

        new CashTransaction({
            transactionId,
            fromAccountId,
            toAccountId,
            amount
        }).save ( function (err) {
            if (err) throw(err);
            return { status: 'error', transactionId, fromAccountId, toAccountId, amount};

        });

        return { status: 'success', transactionId, fromAccountId, toAccountId, amount};
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