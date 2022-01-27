const puppeteer = require('puppeteer');


function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


class Puppet {
    constructor({ puppetOptions, targetUrl, credentials }) {
        this.puppetOptions = puppetOptions;
        this.targetUrl = targetUrl;
        this.initStatus = false;
        this.credentials = credentials;
    }

    async init() {
        console.log('Init started');
        this.initStatus = true;
        this.browser = await puppeteer.launch({ 
            ...this.puppetOptions,
            args: [
                '--window-size=1920,1080',
                '--no-sandbox',
              ],
            defaultViewport: null,
        }).catch( e =>  { throw(e) });;
        this.page = await this.browser.newPage().catch( e =>  { throw(e) });
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
        await this.inputText(`id="${capital_type}"`,amount).catch( e =>  { throw(e) });

        console.log('Transaction after 3');

        await this.page.waitForSelector(`button[id="btn_${capital_type}"]`).catch( e =>  { throw(e) });
        await this.page.click(`button[id="btn_${capital_type}"]`).catch( e =>  { throw(e) });
        
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