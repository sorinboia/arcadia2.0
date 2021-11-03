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
        this.initStatus = true;
        this.browser = await puppeteer.launch({ 
            ...this.puppetOptions,
            args: [
                '--window-size=1920,1080',
              ],
            defaultViewport: null,
            headless: false 
        });
        this.page = await this.browser.newPage();
        this.page.goto(this.targetUrl);
    }

    async inputText(selector, text) {
        
        await this.page.waitForSelector(`input[${selector}]`);
        
        await this.page.type(`input[${selector}]`, text, {delay: randomNumber(100,200)})
        console.log(selector,text);
    }
    
    async wait(time) {
        await this.page.waitForTimeout(time);
    }
    
    async login() {
        
        await this.inputText('id=input-1',this.credentials.username);
        await this.inputText('id=input-2',this.credentials.password);
        await this.page.click('button[type="submit"]');
        await this.wait(randomNumber(3000,7000));
    }

    async transaction({crypto, amount, type}) {
        await this.page.click('a[href="/crypto/exchange"]');
        await this.wait(randomNumber(1000,2000));
        await this.page.select('select.custom-select',crypto);
        if (type == 'sell') {
            await this.page.click('a[aria-posinset="2"]');
        } else {
            await this.page.click('a[aria-posinset="1"]');
        }
        await this.inputText('class="form-control"',amount);
        await this.page.click('button[type="button"]');
        
    }
}


module.exports =  Puppet;