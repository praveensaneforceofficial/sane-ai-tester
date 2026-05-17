const puppeteer = require('puppeteer');

async function findMenuPath() {
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
        
        // Find elements that match 'Activities' or 'Customer' or 'Form' or 'Creation'
        const matches = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, li, span, div'));
            return elements
                .map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    text: (el.innerText || el.textContent || '').trim(),
                    outerHTML: el.outerHTML.substring(0, 200)
                }))
                .filter(m => m.text.toLowerCase().includes('activities') || m.text.toLowerCase().includes('customer') || m.outerHTML.toLowerCase().includes('customerformcreation'));
        });
        
        console.log('✅ Matches:', matches);
    } catch (err) {
        console.error('❌ Error finding menu path:', err);
    } finally {
        await browser.close();
    }
}

findMenuPath();
