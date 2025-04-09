const axios = require('axios');


class User {

    constructor() {
        this.email = null;
        this.jwt = null;
        this.loggedIn = false;

        const currentUser = sessionStorage.getItem('authUser') ? JSON.parse(sessionStorage.getItem('authUser')) : null;

        if (currentUser) {
            this.jwt = currentUser.jwt;
            this.accountId = currentUser.accountId;
            //this.email = currentUser.email Need to add this
            this.axios = axios.create({
                headers: { Authorization: `Bearer ${this.jwt}` }
            });
            this.loggedIn = true;
        }


    }

    login({email,password}) {
        this.email = email;

        return new Promise((res,rej) => {
            axios.post(`/v1/login`, {
                email,
                password
            }).then((response) => {

                const { status, accountId, name, cash, jwt } = response.data;

                if (status == 'success') {
                    this.loggedIn = true;
                    this.accountId = accountId;
                    this.name = name;
                    this.cash = cash;
                    this.jwt = jwt;
                    this.axios = axios.create({
                        headers: { Authorization: `Bearer ${this.jwt}` }
                    });
                    res(response.data);
                } else {
                    res({
                        status: 'fail',
                        msg: 'Bad credentials'
                    });
                }

            }).catch((err) => {
                rej(err);            })
        });
    }

    logout() {
        this.loggedIn = false;
        this.currentUser = null;
        this.email = null;
        this.jwt = null;
        this.axios = null;
    }

    async stockTransaction({symbol,transactionType,amount}) {
        const result = await this.axios.post('/v1/stockt',{symbol,transactionType,amount:parseFloat(amount)});
        return result.data;
    }

    async refreshCurrentUser() {
        const result = await this.axios.get(`/v1/user/${this.accountId}`);
        return result.data;
    }

    async getAllTransactions() {
        const result = await this.axios.get(`/v1/stockt/transactions/${this.accountId}`);
        return result.data;
    }

    async aiChat({newQuestion}) {        
        const result = await this.axios.post('/v1/ai/chat',{ newQuestion});
        return result.data;
    }

    async resetAiChat() {
        const result = await this.axios.get('/v1/ai/chat/reset');
        return result.data;
    }

    // Update signature to accept { useTools }
    async regenerateLastResponse({ useTools }) {
        // Include useTools in the POST body
        const result = await this.axios.post('/v1/ai/chat/regen', { useTools });
        return result.data;
    }
      
        
}


export default (new User());
