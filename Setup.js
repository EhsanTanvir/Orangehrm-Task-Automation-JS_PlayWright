// setup.js
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const directories = ['screenshots', 'test-results', 'playwright-report'];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ ${dir} directory created`);
    } else {
        console.log(`📁 ${dir} directory already exists`);
    }
});

// Clean up old screenshots (optional)
const screenshotsDir = 'screenshots';
if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir);
    files.forEach(file => {
        if (file.endsWith('.png')) {
            fs.unlinkSync(path.join(screenshotsDir, file));
            console.log(`🧹 Deleted old screenshot: ${file}`);
        }
    });
}

console.log('✅ Setup completed successfully!');