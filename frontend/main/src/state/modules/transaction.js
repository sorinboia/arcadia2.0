import user from '@/api/user';

const state = {
    allTransactions: null
};

const mutations = {
    SET_ALL_TRANSACTIONS(state, newValue) {

        state.allTransactions = newValue.map(( x ) => {
            return {
                ...x,
                totalValue: Math.round(x.price * x.amount * 1000) / 1000
            }
        });


        /*state.allTransactions = newValue.map((x) => {
            return {
                'ID': x.transactionId,
                'Crypto': x.symbol.toUpperCase(),
                'Crypto Amount': x.amount,
                'Type': x.transactionType.toUpperCase(),
                'Unit Price': x.price,
                'Total Value': x.price * x.amount,
                'Date': new Date(x.date)
            }
        });*/
    },

};

const getters = {

};

const actions = {
    async getAllTransactions({commit}) {
        const result = await user.getAllTransactions();
        commit('SET_ALL_TRANSACTIONS',result);
    },
};

export  {
    state,
    mutations,
    getters,
    actions,
};
