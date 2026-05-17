const puppeteer = require('puppeteer');

async function checkLoginSelectors() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(el => ({
                id: el.id,
                name: el.name,
                type: el.type,
                placeholder: el.placeholder,
                outerHTML: el.outerHTML
            }));
        });
        console.log('✅ Inputs found on page:', inputs);
    } catch (err) {
        console.error('❌ Error checking selectors:', err);
    } finally {
        await browser.close();
    }
}

checkLoginSelectors();
