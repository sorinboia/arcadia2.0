const puppeteer = require('puppeteer');


function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



const userAgents = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ',
    'Chrome/51.0.2704.106 Safari/537.36 OPR/38.0.2220.41',
    'Opera/9.60 (Windows NT 6.0; U; en) Presto/2.1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ',
    'Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15',
    '(KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',    
];




class Puppet {
    constructor({ puppetOptions, targetUrl, credentials }) {
        this.puppetOptions = puppetOptions;
        this.targetUrl = targetUrl;
        this.initStatus = false;
        this.credentials = credentials;
        this.userAgent = 'Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59' || userAgents[Math.floor(Math.random()*userAgents.length)];
        
    }

    async init() {
        console.log('Init started');
        this.initStatus = true;
        this.browser = await puppeteer.launch({ 
            ...this.puppetOptions,
            args: [
                '--window-size=1920,1080',
                '--no-sandbox',
                '--ignore-certificate-errors'
              ],
            defaultViewport: null,
        }).catch( e =>  { throw(e) });;
        this.page = await this.browser.newPage().catch( e =>  { throw(e) });
        await this.page.setUserAgent(this.userAgent);
        await this.page.goto(this.targetUrl).catch( e =>  { throw(e) });;
    }

    async inputText(selector, text) {
        
        await this.page.waitForSelector(`input[${selector}]`);
        
        await this.page.focus(`input[${selector}]`);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');

        await this.page.type(`input[${selector}]`, text, {delay: randomNumber(100,200)})
        console.log(selector,text);
    }
    
    async wait(time) {
        await this.page.waitForTimeout(time).catch( e =>  { throw(e) });;
    }
    
    async login() {
            console.log('Login started');
            await this.inputText('id=input-1',this.credentials.username).catch( e =>  { throw(e) });
            await this.inputText('id=input-2',this.credentials.password).catch( e =>  { throw(e) });
            await this.page.click('button[type="submit"]').catch( e =>  { throw(e) });
            await this.wait(randomNumber(3000,7000)).catch( e =>  { throw(e) });
            console.log('Login finished.');

        
    }

    async transaction({crypto, amount, type}) {
        console.log('Transaction started');
        const capital_type = type.charAt(0).toUpperCase() + type.slice(1);
        
        await this.page.waitForSelector('a[href="/crypto/exchange"]').catch( e =>  { throw(e) });
        console.log('Transaction after a');
        await this.page.click('a[href="/crypto/exchange"]').catch( e =>  { throw(e) });
        
        console.log('Transaction after 1');
        
        await this.wait(randomNumber(1000,2000)).catch( e =>  { throw(e) });;
        await this.page.select('select.custom-select',crypto).catch( e =>  { throw(e) });

        console.log('Transaction after 2');

        if (type == 'sell') {
            await this.page.click('a[aria-posinset="2"]').catch( e =>  { throw(e) });            
        } else {
            await this.page.click('a[aria-posinset="1"]').catch( e =>  { throw(e) });
        }
        //await this.inputText(`id="${capital_type}"`,amount).catch( e =>  { throw(e) });
        await this.inputText('id="amount"',amount).catch( e =>  { throw(e) });
        

        console.log('Transaction after 3');
        const [ button ] = await this.page.$x(`//button[contains(., '${capital_type} Coin')]`);
        await button.click();
        //console.log(button);
        //await this.page.waitForSelector(`button[id="btn_${capital_type}"]`).catch( e =>  { throw(e) });
        //await this.page.click(`button[id="btn_${capital_type}"]`).catch( e =>  { throw(e) });
        //await this.page.click(button).catch( e =>  { throw(e) });
        
        console.log('Transaction after 4');
        
        await this.page.waitForSelector('button[class="btn mt-3 btn-outline-success btn-block"]').catch( e =>  { throw(e) });
        await this.page.click('button[class="btn mt-3 btn-outline-success btn-block"]').catch( e =>  { throw(e) });

        console.log('Transaction finished');
    }

    async close() {
        await this.browser.close().catch( e =>  { throw(e) });;
    }
}


module.exports =  Puppet;