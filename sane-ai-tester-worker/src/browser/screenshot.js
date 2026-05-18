class ScreenshotUtility {
    async capture(page, path) {
        if (page) {
            return await page.screenshot({ path, fullPage: true });
        }
    }
}
module.exports = new ScreenshotUtility();
