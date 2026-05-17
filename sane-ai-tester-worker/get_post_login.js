const puppeteer = require('puppeteer');

async function checkPostLogin() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        await page.type('#txtUserName', 'admindev');
        await page.type('#txtPassWord', 'dev');
        await page.click('#btnLogin');
        
        console.log('⏳ Clicked login, waiting for navigation...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Navigation wait timed out or resolved: ', e.message));
        
        const currentUrl = page.url();
        console.log('✅ Navigated to URL:', currentUrl);
        
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
        console.log('✅ Page Body Text (first 1000 chars):', bodyText);
        
        const elements = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('select, input, button, a'))
                .map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    name: el.name,
                    className: el.className,
                    innerText: el.innerText || el.value || ''
                }));
        });
        console.log('✅ Form/navigation elements:', elements.slice(0, 20));
    } catch (err) {
        console.error('❌ Error post login:', err);
    } finally {
        await browser.close();
    }
}

checkPostLogin();
