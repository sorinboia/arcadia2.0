// tools.js
const argv = require('yargs').argv;

const {
    webPort,
    usersApiHost,
    loginApiHost,
    cashtApiHost,
    stocktApiHost,
    stocksApiHost,
    llmApiHost,
    llmModel,
    llmSecurityHost,
    llmSecurityAppId
} = argv;

const axios = require('axios');

const tools = [
  {
    name: 'get_all_stock_prices',
    description: 'Get the current prices of all crypto stocks like BTC, LTC and ETH',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    function: async () => {
      try {
        const response = await axios.get(`http://${stocksApiHost}/v1/stock/ticker/all`);
        return response.data;
      } catch (error) {
        console.error('Error fetching stock prices:', error);
        return { error: 'Failed to fetch stock prices' };
      }
    }
  },
  {
    name: 'get_user_data',
    description: 'Get user information like: how much money, LTC, BTC and ETH they have in their portfolio, their name and email. Should only be used when user is asking about their own data',
    parameters: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The account ID of the user'
        },
        jwtToken: {
          type: 'string',
          description: 'JWT token for authentication'
        }
      },
      required: ['accountId', 'jwtToken']
    },
    function: async ({ accountId, jwtToken }) => {
      try {
        const response = await axios.get(`http://${usersApiHost}/v1/user/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return { error: 'Failed to fetch user data' };
      }
    }
  },
  {
    name: 'get_user_transactions',
    description: 'Get all previous transactions for a given account ID',
    parameters: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The account ID of the user'
        },
        jwtToken: {
          type: 'string',
          description: 'JWT token for authentication'
        }
      },
      required: ['accountId', 'jwtToken']
    },
    function: async ({ accountId, jwtToken }) => {
      try {
        const response = await axios.get(`http://${stocktApiHost}/v1/stockt/transactions/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching user transactions:', error);
        return { error: 'Failed to fetch user transactions' };
      }
    }
  }
];

module.exports = tools;