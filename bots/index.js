const argv = require('yargs').argv;


//const targerUrl = argv.url || 'https://arcadia-bfce5397.uksouth.cloudapp.azure.com/';
const targerUrl = argv.url || 'https://studentx.vltr.nginx-experience.com/';






const main = async () => {
        try {


            const client = new (require('./puppet'))( {
                targetUrl: targerUrl,
                credentials: {
                    username: 'satoshi@bitcoin.com',
                    password: 'bitcoin'
                },
                puppetOptions: {
                    headless: false
                }
            });

            const delay = 1000;
            await client.init();
            await client.login();
            for(let i=0;i<2;i++) {
                await client.transaction({crypto: 'ltc',type: 'buy', amount: '3' });
                await client.wait(delay);
                await client.transaction({crypto: 'ltc',type: 'sell', amount: '3' });
                await client.wait(delay);
            }

            await client.close();
        } catch(e) {            
            console.log(e);            
        }          
}


(async () => {
    for (let i=0;i<10000; i++) {
        await main();
    }
})().catch((e) => {
    console.log(e);
    process.exit(1);
});
    




