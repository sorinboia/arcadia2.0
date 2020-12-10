import stock from '@/api/stock';
import user from '@/api/user';

const state = {
    btc: {
        ticker:null,
        candles:null
    },
    eth: {
        ticker:null,
        candles:null
    },
    ltc: {
        ticker:null,
        candles:null
    }
};

const mutations = {
    SET_TICKER_ALL(state, newValue) {
        state.btc.ticker = newValue.btc.ticker;
        state.eth.ticker = newValue.eth.ticker;
        state.ltc.ticker = newValue.ltc.ticker;




    },
    SET_CANDLES_ALL(state, newValue) {
        state.btc.candles = prepCandles(newValue.btc);
        state.eth.candles = prepCandles(newValue.eth);
        state.ltc.candles = prepCandles(newValue.ltc);
    }
};

const getters = {

};

const actions = {
    async getAllStockTicker({commit}) {
        const result = await stock.stockTicker('all');
        commit('SET_TICKER_ALL',result);
    },
    async getAllStockCandles({commit}) {
        const result = await stock.stockCandles('all');
        commit('SET_CANDLES_ALL',result);
    },
    async stockTransaction({commit, dispatch},{symbol,transactionType,amount}) {
        const result = await user.stockTransaction({symbol,transactionType,amount});
        dispatch('auth/refreshCurrentUser',null, { root: true });
        dispatch('transaction/getAllTransactions',null, { root: true });
        return result;
    }

};

export  {
    state,
    mutations,
    getters,
    actions,
};


function prepCandles(series) {
    const data =  series.map( (i) => {
        return {
            x: new Date(i.mts),
            y: [i.open, i.high, i.low, i.close]
        }

    });
    return [{data}]
}