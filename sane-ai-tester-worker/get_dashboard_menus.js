const puppeteer = require('puppeteer');

async function checkDashboardMenus() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://dev.saneforce.com/', { waitUntil: 'networkidle2' });
        await page.type('#txtUserName', 'admindev');
        await page.type('#txtPassWord', 'dev');
        await page.click('#btnLogin');
        
        console.log('⏳ Waiting for division selection page...');
        await page.waitForSelector('#ddldivision', { timeout: 10000 });
        
        console.log('⏳ Selecting division...');
        await page.select('#ddldivision', '1'); // Select भंडारी consumer products
        
        console.log('⏳ Waiting for dashboard/home navigation...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        
        const currentUrl = page.url();
        console.log('✅ Navigated to URL:', currentUrl);
        
        // Wait 3 seconds for dynamic menus to render
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const menus = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a, li, span'))
                .map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    text: (el.innerText || el.textContent || '').trim(),
                    href: el.href || ''
                }))
                .filter(m => m.text.length > 0 && m.text.length < 50);
        });
        
        console.log('✅ Found Menu Links:', menus);
    } catch (err) {
        console.error('❌ Error checking menus:', err);
    } finally {
        await browser.close();
    }
}

checkDashboardMenus();
