const projectRepository = require('../repositories/projectRepository');
const puppeteer = require('puppeteer');

class ZohoSprintScraper {
    /**
     * Scrape projects from Zoho Sprint UI using Puppeteer
     * Launches a browser, handles login persistence, and intercepts API data.
     */
    async scrapeProjects() {
        let browser;
        try {
            console.log('Initiating Zoho Sprints Puppeteer Scrape...');
            
            // Launch puppeteer
            browser = await puppeteer.launch({
                headless: false, // Show UI so user can login if needed
                defaultViewport: null,
                userDataDir: './zoho_session' // persist login
            });
            
            const page = await browser.newPage();
            
            // We want to capture the JSON response when the page fetches projects
            let projectsList = null;
            
            // Set up network interception
            page.on('response', async (response) => {
                const url = response.url();
                // Check if it's the projects data endpoint
                if (url.includes('/projects/') && (url.includes('action=data') || url.includes('action='))) {
                    try {
                        const json = await response.json();
                        // Parse JSON dynamically based on structure
                        if (Array.isArray(json)) {
                            projectsList = json;
                        } else if (json.projects && Array.isArray(json.projects)) {
                            projectsList = json.projects;
                        } else if (json.data && Array.isArray(json.data)) {
                            projectsList = json.data;
                        } else {
                            for (const key in json) {
                                if (Array.isArray(json[key])) {
                                    projectsList = json[key];
                                    break;
                                }
                            }
                        }
                        if (projectsList && projectsList.length > 0) {
                            console.log(`Intercepted project data packet with ${projectsList.length} items!`);
                        }
                    } catch (e) {
                        // ignore parsing errors for non-json or incomplete responses
                    }
                }
            });

            console.log("Navigating to Zoho Sprints...");
            await page.goto("https://sprints.zoho.in/workspace/sanmedia#projects", { timeout: 60000 }).catch(() => {});
            
            console.log("Waiting for project data to load. Please log in if prompted...");
            
            // Poll until projectsList is populated or timeout (120 seconds max)
            let waitTime = 0;
            while (!projectsList && waitTime < 120000) {
                const currentUrl = page.url();
                
                // If user logged in, but Zoho redirected them to the main dashboard instead of projects tab
                if (currentUrl.includes('/workspace/sanmedia') && !currentUrl.includes('#projects') && !currentUrl.includes('signin')) {
                    console.log("User logged in! Redirecting back to projects tab to capture data...");
                    await page.goto("https://sprints.zoho.in/workspace/sanmedia#projects", { waitUntil: 'domcontentloaded' }).catch(() => {});
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                waitTime += 1000;
            }

            if (!projectsList) {
                throw new Error("Timeout waiting for project data to load. Make sure you logged in correctly.");
            }
            
            console.log(`Found ${projectsList.length} projects. Returning data to client...`);
            await browser.close();

            // Map and return projects
            const formattedProjects = projectsList.map(proj => {
                return {
                    id: proj.id || proj.projectJobjId || proj.projectId || `zoho-${Math.random().toString(36).substr(2, 9)}`,
                    name: proj.name || proj.projectName || proj.title || 'Untitled Zoho Project',
                    description: proj.description || ''
                };
            });

            return {
                success: true,
                message: `Successfully scraped ${formattedProjects.length} projects from Zoho Sprints.`,
                raw_count: projectsList.length,
                projects: formattedProjects
            };

        } catch (error) {
            if (browser) {
                await browser.close().catch(() => {});
            }
            console.error('Zoho Scraper Error:', error.message);
            throw new Error(`Puppeteer Scraper Error: ${error.message}`);
        }
    }
}

module.exports = new ZohoSprintScraper();
