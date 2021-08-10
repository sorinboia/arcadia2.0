const argv = require('yargs').argv;

const targerUrl = argv.url || 'http://localhost:5000/';
const users = argv.users || 1;


const client = new (require('./puppet'))( {
    targetUrl: 'http://localhost:5000/',
    credentials: {
        username: 'sorin@nginx.com',
        password: 'nginx'
    },
    puppetOptions: {
        headless: true
    }
});


(async () => {
    await client.init();
    await client.login();
    await client.transaction({crypto: 'ltc',type: 'sell', amount: '1' });
    await client.wait(10000);
  })();
