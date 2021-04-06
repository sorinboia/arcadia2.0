const btc = {
    ticker: {ask: 111, bid: 111},
    candles: []
};

const eth = {
    ticker: {ask: 111, bid: 111},
    candles: []
};

const ltc = {
    ticker: {ask: 111, bid: 111},
    candles: []
};

const { WSv2 } = require('bitfinex-api-node');
const ws = new WSv2({ transform: true });
ws.on('error', (err) => console.log(err));


ws.on('open', () => {
    ws.subscribeTicker('tBTCUSD');
    ws.subscribeTicker('tETHUSD');
    ws.subscribeTicker('tLTCUSD');
    ws.subscribeCandles('trade:1D:tBTCUSD');
    ws.subscribeCandles('trade:1D:tETHUSD');
    ws.subscribeCandles('trade:1D:tLTCUSD');

    //ws.subscribeTrades('BTCUSD')
});

ws.onTicker({ symbol: 'tBTCUSD' }, (ticker) => {

    const tmp = ticker.toJS();
    tmp.ask = Math.round(tmp.ask * 100) / 100;
    tmp.bid = Math.round(tmp.bid * 100) / 100;
    btc.ticker = tmp;

});

ws.onTicker({ symbol: 'tETHUSD' }, (ticker) => {
    const tmp = ticker.toJS();
    tmp.ask = Math.round(tmp.ask * 100) / 100;
    tmp.bid = Math.round(tmp.bid * 100) / 100;
    eth.ticker = tmp;
});

ws.onTicker({ symbol: 'tLTCUSD' }, (ticker) => {
    const tmp = ticker.toJS();
    tmp.ask = Math.round(tmp.ask * 100) / 100;
    tmp.bid = Math.round(tmp.bid * 100) / 100;
    ltc.ticker = tmp;
});

ws.onCandle({ key: 'trade:1D:tBTCUSD' }, (candles) => {
    btc.candles = [...btc.candles,...candles];
});

ws.onCandle({ key: 'trade:1D:tETHUSD' }, (candles) => {
    eth.candles = [...eth.candles,...candles];
});

ws.onCandle({ key: 'trade:1D:tLTCUSD' }, (candles) => {
    ltc.candles = [...ltc.candles,...candles];
});


setTimeout(() => {
    ws.open();
},30000);


module.exports = {
    btc,
    eth,
    ltc
};
