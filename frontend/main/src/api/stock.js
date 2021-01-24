const axios = require('axios');
const apiDomain = 'https://api.arcadiacrypto.net';

class Stock {

    constructor() {

    }

    stockTicker(symbol) {
        return new Promise((res,rej) => {
            axios.get(`${apiDomain}/v1/stock/ticker/${symbol}`,{withCredentials: true})
                .then((response) => {
                    res(response.data);
                }).catch((err) => {
                rej(err);
            });
        });
    }

    stockCandles(symbol) {
        return new Promise((res,rej) => {
            axios.get(`${apiDomain}/v1/stock/candles/${symbol}`,{withCredentials: true})
                .then((response) => {
                    res(response.data);
                }).catch((err) => {
                rej(err);
            });
        });
    }

}


export default (new Stock());