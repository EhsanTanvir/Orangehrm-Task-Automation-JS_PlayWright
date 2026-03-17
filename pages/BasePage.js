// pages/BasePage.js for POM
class BasePage {
    constructor(page) {
        this.page = page;
        this.timeout = 60000; 
    }

    async navigate(url) {
        try {
            
            await this.page.goto(url, { 
                timeout: this.timeout,
                waitUntil: 'domcontentloaded'
            });
            console.log(`Navigation successful to ${url}`);
        } catch (error) {
            console.error(`Navigation failed to ${url}:`, error.message);
            throw error;
        }
    }

    async waitForElement(selector, state = 'visible', timeout = this.timeout) {
        try {
            await this.page.waitForSelector(selector, { state, timeout });
        } catch (error) {
            console.error(`Element ${selector} not ${state} within ${timeout}ms:`, error.message);
            throw error;
        }
    }

    async click(selector) {
        try {
            await this.waitForElement(selector);
            await this.page.click(selector);
        } catch (error) {
            console.error(`Failed to click ${selector}:`, error.message);
            throw error;
        }
    }

    async fill(selector, text) {
        try {
            await this.waitForElement(selector);
            await this.page.fill(selector, text);
        } catch (error) {
            console.error(`Failed to fill ${selector}:`, error.message);
            throw error;
        }
    }

    async getText(selector) {
        try {
            await this.waitForElement(selector);
            return await this.page.textContent(selector);
        } catch (error) {
            console.error(`Failed to get text from ${selector}:`, error.message);
            return '';
        }
    }

    async isVisible(selector, timeout = 5000) {
        try {
            await this.waitForElement(selector, 'visible', timeout);
            return true;
        } catch {
            return false;
        }
    }

    async waitForTimeout(ms) {
        try {
            if (this.page && !this.page.isClosed()) {
                await this.page.waitForTimeout(ms);
            } else {
                await new Promise(resolve => setTimeout(resolve, ms));
            }
        } catch (error) {
            console.log('Error during waitForTimeout:', error.message);
            await new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    async takeScreenshot(name) {
        try {
            if (!this.page || this.page.isClosed()) {
                console.log(`Cannot take screenshot "${name}" - page is closed`);
                return null;
            }
            
            const timestamp = Date.now();
            const screenshotPath = `screenshots/${name}-${timestamp}.png`;
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.log(`Failed to take screenshot "${name}":`, error.message);
            return null;
        }
    }

    async closeBrowser() {
        try {
            if (this.page && !this.page.isClosed()) {
                await this.page.context().close();
            }
        } catch (error) {
            console.log('Error closing browser:', error.message);
        }
    }
}

module.exports = BasePage;