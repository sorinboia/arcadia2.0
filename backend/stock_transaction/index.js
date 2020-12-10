const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost, stocksApiHost } = argv;



const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const axios = require('axios');

const ARCADIA_DB = `mongodb://${arcadiaDB}/arcadia-db`;
const API_VERSION = 'v1';
const StockTransaction = require('./models/stock_transaction');

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
    url: `/${API_VERSION}/stockt/transactions/:accountId`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {

        const { accountId } = request.params;
        const result = await StockTransaction.find({ accountId },{ '_id': 0, '__v':0, 'accountId':0 });
        return result;
    }
});

// Make Transaction
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/stockt`,
    preValidation: [fastify.authenticate],
    handler: async (request,reply) => {

        const authorization = request.headers.authorization;
        const accountId = request.user.sub;
        const { symbol, amount, transactionType } = request.body;

        const result = await Promise.all([
            axios.get(`http://${usersApiHost}/v1/user/${accountId}`,{
                headers: {
                    authorization
                }}),
            axios.get(`http://${stocksApiHost}/v1/stock/ticker/${symbol}`,{
                headers: {
                    authorization
                }}),
        ]);



        const user_cash = result[0].data.cash;
        const stock_price = result[1].data.ticker[transactionType == 'buy' ? 'ask' : 'bid'];


        const data = {
            accountId,
            stocks: result[0].data.stocks || {}
        };
        data.stocks[symbol] = data.stocks[symbol] || 0 ;

        if (transactionType == 'buy') {
            if ((stock_price * amount) >= user_cash) {
                return { status: 'fail', reason: 'Balance to low', accountId, symbol, transactionType, amount};
            }

            console.log('WHAT IS THIS',data.stocks[symbol],amount);
            data.cash = user_cash - stock_price * amount;
            data.stocks[symbol] +=  amount;


        } else if (transactionType == 'sell') {
            if (data.stocks[symbol] < amount ) {
                return { status: 'fail', reason: 'Not enough stock balance', accountId, symbol, transactionType, amount};
            }
            data.cash = user_cash + stock_price * amount;
            data.stocks[symbol] -=  amount;
        }

        await axios({
            method: 'PATCH',
            url: `http://${usersApiHost}/v1/user`,
            headers: {
                authorization
            },
            data: data
        });

        // Generating an random transaction id
        const transactionId = Math.floor(Math.random() * (9999999999 - 1000000000) + 1000000000 );

        new StockTransaction({
            transactionId,
            accountId,
            symbol,
            transactionType,
            amount,
            price: stock_price,
            date: Date.now()
        }).save ( function (err) {
            if (err) throw(err);
            return { status: 'error', transactionId, accountId, symbol, transactionType, amount};

        });

        return { status: 'success', transactionId, accountId, symbol, transactionType, amount};
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