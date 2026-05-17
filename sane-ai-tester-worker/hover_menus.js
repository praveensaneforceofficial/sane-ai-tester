const puppeteer = require('puppeteer');

async function checkHoverMenus() {
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
        
        // Hover over the Master menu link
        console.log('⏳ Hovering over Master...');
        const masterLink = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('a')).find(el => el.innerText.trim() === 'Master');
        });
        
        if (masterLink) {
            await masterLink.hover();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Print the dropdown-menu HTML or all visible links on page
            const visibleLinks = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a'))
                    .map(el => ({
                        text: el.innerText.trim(),
                        href: el.getAttribute('href') || '',
                        visible: el.offsetWidth > 0 && el.offsetHeight > 0
                    }))
                    .filter(el => el.text.length > 0 && el.visible);
            });
            console.log('✅ Visible Links after Hovering Master:', visibleLinks);
        } else {
            console.log('❌ Master link not found!');
        }
        
    } catch (err) {
        console.error('❌ Error checking hover menus:', err);
    } finally {
        await browser.close();
    }
}

checkHoverMenus();
