const axios = require('axios');


class Stock {

    constructor() {

    }

    stockTicker(symbol) {
        return new Promise((res,rej) => {
            axios.get(`/v1/stock/ticker/${symbol}`)
            .then((response) => {
                res(response.data);
            }).catch((err) => {
                rej(err);
            });
        });
    }

    stockCandles(symbol) {
        return new Promise((res,rej) => {
            axios.get(`/v1/stock/candles/${symbol}`)
                .then((response) => {
                    res(response.data);
                }).catch((err) => {
                rej(err);
            });
        });
    }

}


export default (new Stock());