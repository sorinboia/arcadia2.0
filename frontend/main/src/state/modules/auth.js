import user from '../../api/user';
import router from '@/router';


const state = {
    currentUser: sessionStorage.getItem('authUser') ? JSON.parse(sessionStorage.getItem('authUser')) : null,
};

const mutations = {
    SET_CURRENT_USER(state, newValue) {
        if (newValue) newValue.cash = Math.round(newValue.cash * 100) / 100;
        state.currentUser = newValue;

        sessionStorage.setItem('authUser',JSON.stringify(newValue));
    },

    UPDATE_CASH_STOCK(state,newCurrentUser) {
        state.currentUser.cash = Math.round(newCurrentUser.cash * 100) / 100;
        state.currentUser.stocks = newCurrentUser.stocks;
    }
};

const getters = {
    loggedIn(state) {
        return !!state.currentUser;
    },
};

const actions = {
    logOut({commit}) {
        sessionStorage.removeItem('authUser');
        commit('SET_CURRENT_USER',null);
        user.logout();
        router.push('/login');
    },
    async logIn({commit},data) {
        const  result  = await user.oktaLogin({email:data.email,password:data.password});

        if (result.status == 'success') {

            commit('SET_CURRENT_USER',result);

        }
        return result;
    },
    validate({ commit, state }) {
        //THIS SHOULD BE CHANGED IT IS VALIDATING THAT THE USER IS ACTUALLY LOGGED IN
        //if (!state.currentUser) return Promise.resolve(null);

        //commit('SET_CURRENT_USER', state.currentUser);
        return state.currentUser;
    },
    async refreshCurrentUser({commit}) {
        const currentUser = await user.refreshCurrentUser();
        commit('UPDATE_CASH_STOCK',currentUser);
    }
};

export  {
    state,
    mutations,
    getters,
    actions,
};