const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function setup() {
    console.log('📦 Setting up Sane-AI Worker...');
    
    // Create directories
    const dirs = ['./recordings', './recordings/screenshots', './recordings/videos', './recordings/logs'];
    for (const dir of dirs) {
        await fs.ensureDir(dir);
        console.log(`✅ Created: ${dir}`);
    }
    
    // Copy .env.example if .env doesn't exist
    if (!fs.existsSync('.env')) {
        fs.copySync('.env.example', '.env');
        console.log('✅ Created .env file from .env.example');
    }
    
    // Install Playwright browsers
    try {
        console.log('🌐 Installing Playwright browsers...');
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('✅ Playwright browsers installed');
    } catch (error) {
        console.error('❌ Failed to install Playwright browsers:', error.message);
    }
    
    console.log('\n✅ Setup complete!');
    console.log('\nTo start worker:');
    console.log('  npm start');
    console.log('\nTo start with Electron GUI:');
    console.log('  npm run electron');
}

setup();