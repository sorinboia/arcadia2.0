// tools.js

const tools = [
    {
      name: 'get_stock_price',
      description: 'Get the current price of a stock',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol, e.g., AAPL for Apple Inc.'
          }
        },
        required: ['symbol']
      },
      function: async ({ symbol }) => {
        // This is a mock implementation. In a real scenario, you'd call an API or database.
        const mockPrices = {
          AAPL: 150.25,
          GOOGL: 2750.80,
          MSFT: 300.50
        };
        return mockPrices[symbol.toUpperCase()] || 'Stock price not found';
      }
    },
    // Add more tools/functions as needed
  ];
  
  module.exports = tools;