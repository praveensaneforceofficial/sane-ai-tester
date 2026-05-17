const puppeteer = require('puppeteer');

async function checkIframes() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        await page.type('#txtUserName', 'admindev');
        await page.type('#txtPassWord', 'dev');
        await page.click('#btnLogin');
        
        await page.waitForSelector('#ddldivision', { timeout: 10000 });
        await page.select('#ddldivision', '1');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const iframes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('iframe'))
                .map(el => ({
                    id: el.id,
                    name: el.name,
                    src: el.src
                }));
        });
        console.log('✅ Found iframes:', iframes);
    } catch (err) {
        console.error('❌ Error checking iframes:', err);
    } finally {
        await browser.close();
    }
}

checkIframes();
