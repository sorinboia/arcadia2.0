const axios = require('axios');
const OktaAuth = require('@okta/okta-auth-js').OktaAuth;
const authClient = new OktaAuth({issuer: 'https://dev-4525016.okta.com'});


const oktaClientId = '0oa49htb5Ile8O6gz5d6';
const apiDomain = '';
//const apiDomain = 'http://127.0.0.1:8080';


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

    oktaLogin({email,password}) {
        this.email = email;
        return new Promise(async (res,rej) => {
            const transaction = await authClient.signIn({username: email, password: password}).catch(err => {
                rej(err);
            });
            if (transaction.status === 'SUCCESS') {
                const response = await authClient.token.getWithoutPrompt({
                    clientId: oktaClientId,
                    responseType: ['id_token', 'token'],
                    scopes: ['openid', 'email', 'profile'],
                    sessionToken: transaction.sessionToken,
                    redirectUri: window.location.origin + '/login/callback'
                });


                //localStorage.token = response.tokens.accessToken;
                //localStorage.idToken = response.tokens.idToken;

                this.jwt = response.tokens.idToken.value;
                this.axios = axios.create({
                    headers: { Authorization: `Bearer ${this.jwt}` }
                });
                this.accountId = (await this.getAccountIdFromEmail()).accountId;
                const deviceIdCheck = await this.checkDeviceId();
                if (deviceIdCheck.status == 'fail') {
                    rej(deviceIdCheck);
                    return;
                }

                this.refreshCurrentUser()
                    .then((data) => {
                        data.jwt = this.jwt;
                        res(data);
                    })
            }
        });
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
                    this.accountId = accountId;
                    this.name = name;
                    this.cash = cash;
                    this.jwt = jwt;
                    this.axios = axios.create({
                        headers: { Authorization: `Bearer ${this.jwt}` }
                    });
                }
                res(response.data);
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
        const result = await this.axios.post(`${apiDomain}/v1/stockt`,{symbol,transactionType,amount:parseFloat(amount)});
        return result.data;
    }

    async refreshCurrentUser() {
        const result = await this.axios.get(`${apiDomain}/v1/user/${this.accountId}`);
        return result.data;
    }

    async getAccountIdFromEmail() {
        const result = await this.axios.get(`${apiDomain}/v1/user/email/${this.email}`);
        return result.data;
    }

    async getAllTransactions() {
        const result = await this.axios.get(`${apiDomain}/v1/stockt/transactions/${this.accountId}`);
        return result.data;
    }

    async checkDeviceId() {
        const result = await this.axios.get(`${apiDomain}/v1/login/deviceid`);
        return result.data;
    }
}


export default (new User());