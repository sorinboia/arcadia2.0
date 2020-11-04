const argv = require('yargs').argv;

const arcadiaDB = argv.db || '10.100.102.13';


const {webPort, usersApiHost, loginApiHost, cashtApiHost, stocktApiHost } = argv;


const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

const ARCADIA_DB = `mongodb://${arcadiaDB}/arcadia-db`;
const API_VERSION = 'v1';
const Stock = require('./models/stock');

fastify.route({
    method: 'GET',
    url: `/${API_VERSION}/stock/:symbol`,
    handler: async (request,reply) => {

        const { symbol } = request.params;

        const result = await Stock.findOne({ symbol });
        return result;
    }
});

// Creating a new stock
fastify.route({
    method: 'POST',
    url: `/${API_VERSION}/stock`,
    handler: async (request,reply) => {
        const { symbol, name, price } = request.body;

        new Stock({
            symbol,
            name,
            price
        }).save ( function (err) {
            if (err) throw(err);
        });

        return { status: 'success'};
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