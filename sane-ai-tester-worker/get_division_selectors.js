const puppeteer = require('puppeteer');

async function checkDivisions() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        await page.type('#txtUserName', 'admindev');
        await page.type('#txtPassWord', 'dev');
        await page.click('#btnLogin');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        
        const dropdowns = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('select, input[type="button"], input[type="submit"], select option, td, div'))
                .map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    innerText: el.innerText || el.value || '',
                    outerHTML: el.outerHTML.substring(0, 200)
                }))
                .filter(el => el.innerText?.toLowerCase().includes('division') || el.outerHTML?.toLowerCase().includes('select') || el.id?.toLowerCase().includes('ddl') || el.id?.toLowerCase().includes('div'));
        });
        console.log('✅ Selectors found:', dropdowns.slice(0, 15));
    } catch (err) {
        console.error('❌ Error post login:', err);
    } finally {
        await browser.close();
    }
}

checkDivisions();
