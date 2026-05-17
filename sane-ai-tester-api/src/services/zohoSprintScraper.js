const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const sessionDir = path.join(__dirname, '../../zoho_session');
const lockFile = path.join(sessionDir, 'SingletonLock');
const pidFile = path.join(__dirname, '../../zoho_browser.pid');

// Track the browser instance globally within the current process
let activeBrowser = null;

/**
 * Kill any stale Chrome process from a previous run.
 * Reads PID from file (survives server restarts), kills the process, and cleans up.
 */
function killStaleBrowser() {
    // 1. Kill by in-memory reference (same process)
    if (activeBrowser) {
        try {
            const proc = activeBrowser.process();
            if (proc) proc.kill('SIGKILL');
        } catch (e) { /* ignore */ }
        activeBrowser = null;
    }

    // 2. Kill by saved PID (survives server restarts)
    if (fs.existsSync(pidFile)) {
        const savedPid = fs.readFileSync(pidFile, 'utf8').trim();
        if (savedPid) {
            console.log(`Killing stale browser process PID: ${savedPid}`);
            try {
                // Windows: taskkill by PID
                execSync(`taskkill /PID ${savedPid} /T /F`, { stdio: 'ignore' });
            } catch (e) { /* process may already be dead */ }
        }
        try { fs.unlinkSync(pidFile); } catch (e) { /* ignore */ }
    }

    // 3. Remove the Chromium SingletonLock so it can relaunch
    if (fs.existsSync(lockFile)) {
        console.log('Removing stale SingletonLock file...');
        try { fs.unlinkSync(lockFile); } catch (e) { /* ignore */ }
    }
}

class ZohoSprintScraper {
    /**
     * Scrape projects from Zoho Sprint UI using Puppeteer.
     * - Kills any previous browser by PID before launching.
     * - Navigates to Zoho Sprints workspace URL.
     * - Waits for login if required (session persists via userDataDir).
     * - Runs the Zoho internal API fetch directly in the browser context.
     * - Parses projectJObj to extract real project IDs and names.
     */
    async scrapeProjects() {
        // --- Step 1: Kill old browser (by memory ref + saved PID) ---
        console.log('Cleaning up old browser sessions...');
        killStaleBrowser();
        await new Promise(r => setTimeout(r, 500)); // brief pause after kill

        try {
            console.log('Launching Puppeteer browser...');

            activeBrowser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                userDataDir: sessionDir, // persistent login across sessions
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--new-window']
            });

            // Save PID to file so next call can kill it even after server restart
            const browserPid = activeBrowser.process()?.pid;
            if (browserPid) {
                fs.writeFileSync(pidFile, String(browserPid));
                console.log(`Browser launched with PID: ${browserPid}`);
            }

            // Close all existing tabs, keep only one clean tab
            const pages = await activeBrowser.pages();
            for (let i = 1; i < pages.length; i++) {
                await pages[i].close().catch(() => {});
            }
            const page = pages[0];

            // --- Step 2: Navigate to Zoho Sprints workspace ---
            console.log('Navigating to Zoho Sprints...');
            await page.goto('https://sprints.zoho.in/workspace/sanmedia#projects', {
                timeout: 120000
            }).catch(() => {});

            // --- Step 3: Wait for login and correct URL (up to 2 mins) ---
            console.log('Waiting for login if needed (up to 2 minutes)...');
            let waitTime = 0;
            while (waitTime < 120000) {
                const currentUrl = page.url();

                if (currentUrl.includes('accounts.zoho')) {
                    await new Promise(r => setTimeout(r, 2000));
                    waitTime += 2000;
                    continue;
                }

                if (currentUrl.includes('/workspace/sanmedia') && !currentUrl.includes('#projects')) {
                    console.log('Logged in! Redirecting to projects tab...');
                    await page.goto('https://sprints.zoho.in/workspace/sanmedia#projects', {
                        waitUntil: 'domcontentloaded', timeout: 30000
                    }).catch(() => {});
                }

                if (currentUrl.includes('/workspace/sanmedia')) {
                    await new Promise(r => setTimeout(r, 3000));
                    break;
                }

                await new Promise(r => setTimeout(r, 2000));
                waitTime += 2000;
            }

            // --- Step 4: Extract CSRF token from browser cookies ---
            console.log('Extracting CSRF token...');
            const cookies = await page.cookies('https://sprints.zoho.in');
            const zsctCookie = cookies.find(c => c.name === 'zsct') || cookies.find(c => c.name === 'CSRF_TOKEN');
            const csrfToken = zsctCookie ? `zscp=${zsctCookie.value}` : '';
            if (!csrfToken) {
                console.warn('CSRF token not found — request may fail with 400.');
            } else {
                console.log('CSRF token extracted successfully.');
            }

            // --- Step 5: Run the Zoho API fetch from inside the browser ---
            console.log('Fetching project data from Zoho API...');
            const rawData = await page.evaluate(async (csrfToken) => {
                try {
                    const response = await fetch(
                        'https://sprints.zoho.in/zsapi/team/60030131597/projects/?action=data&range=25&projectstatus=1&viewby=0&index=1',
                        {
                            method: 'GET',
                            credentials: 'include',
                            headers: {
                                'accept': '*/*',
                                'accept-language': 'en-US,en;q=0.9',
                                'x-requested-with': 'XMLHttpRequest',
                                'x-zcsrf-token': csrfToken
                            }
                        }
                    );
                    if (!response.ok) return { error: `HTTP ${response.status}` };
                    return await response.json();
                } catch (err) {
                    return { error: err.message };
                }
            }, csrfToken);

            // --- Step 6: Close browser & clean up PID file ---
            try { await activeBrowser.close(); } catch (e) { /* ignore */ }
            activeBrowser = null;
            if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);

            // --- Step 7: Parse the response ---
            if (rawData.error) {
                throw new Error(`Zoho API error: ${rawData.error}`);
            }
            if (rawData.status !== 'success' || !rawData.projectJObj) {
                throw new Error(`Unexpected Zoho response: ${JSON.stringify(rawData).substring(0, 200)}`);
            }

            const projectJObj = rawData.projectJObj;
            const projectIds = rawData.projectIds || Object.keys(projectJObj);

            const formattedProjects = projectIds
                .filter(id => projectJObj[id])
                .map(id => ({
                    id: id,
                    name: projectJObj[id][0] || `Project ${id}`,
                    description: ''
                }));

            console.log(`Extracted ${formattedProjects.length} projects:`, formattedProjects.map(p => p.name));

            return {
                success: true,
                message: `Successfully scraped ${formattedProjects.length} projects from Zoho Sprints.`,
                raw_count: formattedProjects.length,
                projects: formattedProjects
            };

        } catch (error) {
            // Always clean up browser on error
            if (activeBrowser) {
                try {
                    const proc = activeBrowser.process();
                    if (proc) proc.kill('SIGKILL');
                    await activeBrowser.close().catch(() => {});
                } catch (e) { /* ignore */ }
                activeBrowser = null;
            }
            if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
            console.error('Zoho Scraper Error:', error.message);
            throw new Error(`Puppeteer Scraper Error: ${error.message}`);
        }
    }
}

module.exports = new ZohoSprintScraper();
