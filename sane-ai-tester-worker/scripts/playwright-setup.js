const { execSync } = require('child_process');
const fs = require('fs-extra');

async function setupPlaywright() {
    console.log('🎭 Setting up Playwright...');
    
    try {
        // Install Playwright browsers
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('✅ Chromium installed');
        
        // Verify installation
        execSync('npx playwright --version', { stdio: 'inherit' });
        console.log('✅ Playwright setup complete');
        
    } catch (error) {
        console.error('❌ Playwright setup failed:', error.message);
        process.exit(1);
    }
}

setupPlaywright();