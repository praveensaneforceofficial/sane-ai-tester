const puppeteer = require('puppeteer');

async function checkMenuSubItems() {
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
        
        // Find all <a> or <span> inside dropdown menus or nav lists
        const dropdownItems = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.dropdown-menu a, .nav-item a, ul.nav a, .menu a'))
                .map(el => ({
                    parent: el.parentElement?.className || '',
                    text: el.innerText.trim(),
                    href: el.getAttribute('href') || ''
                }));
        });
        
        console.log('✅ Found submenu links:', dropdownItems);
    } catch (err) {
        console.error('❌ Error checking submenus:', err);
    } finally {
        await browser.close();
    }
}

checkMenuSubItems();
