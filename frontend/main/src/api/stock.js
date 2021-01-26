const axios = require('axios');


const apiDomain = 'https://api2.arcadiacrypto.net';
//const apiDomain = 'http://127.0.0.1:8080';

class Stock {

    constructor() {

    }

    stockTicker(symbol) {
        return new Promise((res,rej) => {
            axios.get(`${apiDomain}/v1/stock/ticker/${symbol}`)
                .then((response) => {
                    res(response.data);
                }).catch((err) => {
                rej(err);
            });
        });
    }

    stockCandles(symbol) {
        return new Promise((res,rej) => {
            axios.get(`${apiDomain}/v1/stock/candles/${symbol}`)
                .then((response) => {
                    res(response.data);
                }).catch((err) => {
                rej(err);
            });
        });
    }

}


export default (new Stock());