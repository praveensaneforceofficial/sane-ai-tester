const puppeteer = require('puppeteer');

async function checkOptions() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        await page.type('#txtUserName', 'admindev');
        await page.type('#txtPassWord', 'dev');
        await page.click('#btnLogin');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        
        const options = await page.evaluate(() => {
            const select = document.querySelector('#ddldivision');
            if (!select) return [];
            return Array.from(select.querySelectorAll('option')).map(opt => ({
                value: opt.value,
                text: opt.innerText
            }));
        });
        console.log('✅ ddldivision Options:', options);
    } catch (err) {
        console.error('❌ Error checking options:', err);
    } finally {
        await browser.close();
    }
}

checkOptions();
