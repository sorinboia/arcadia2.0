const argv = require('yargs').argv;

const targerUrl = argv.url || 'http://localhost:5000/';
const users = argv.users || 1;


const client = new (require('./puppet'))( {
    targetUrl: 'https://arcadia.vltr.nginx-experience.com/',
    credentials: {
        username: 'satoshi@bitcoin.com',
        password: 'bitcoin'
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
