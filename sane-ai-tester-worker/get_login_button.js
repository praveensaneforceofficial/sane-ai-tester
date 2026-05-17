const puppeteer = require('puppeteer');

async function checkLoginButton() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, input[type="submit"], a, input[type="button"]'))
                .map(el => ({
                    id: el.id,
                    name: el.name,
                    type: el.type,
                    innerText: el.innerText || el.value,
                    outerHTML: el.outerHTML
                }))
                .filter(b => b.innerText?.toLowerCase().includes('login') || b.outerHTML?.toLowerCase().includes('login') || b.id?.toLowerCase().includes('btn') || b.id?.toLowerCase().includes('log'));
        });
        console.log('✅ Buttons found on page:', buttons);
    } catch (err) {
        console.error('❌ Error checking buttons:', err);
    } finally {
        await browser.close();
    }
}

checkLoginButton();
