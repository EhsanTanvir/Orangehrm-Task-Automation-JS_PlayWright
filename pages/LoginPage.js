// pages/LoginPage.js
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        
        // Locators
        this.usernameInput = 'input[name="username"]';
        this.passwordInput = 'input[name="password"]';
        this.loginButton = 'button[type="submit"]';
        this.loginLogo = '.orangehrm-login-logo';
        this.errorMessage = '.oxd-alert-content-text';
        this.dashboardUrl = 'dashboard'; // URL fragment to check
    }

    async navigateToLogin() {
        try {
            
            await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', {
                timeout: 30000,
                waitUntil: 'domcontentloaded' 
            });
            console.log('Navigation to login page successful');
        } catch (error) {
            console.log('Navigation timeout or error:', error.message);
            
        }
    }

    async waitForLoginPage() {
        try {
            await Promise.all([
                this.waitForElement(this.usernameInput, 'visible', 10000),
                this.waitForElement(this.passwordInput, 'visible', 10000),
                this.waitForElement(this.loginButton, 'visible', 10000)
            ]);
            console.log('Login page elements loaded successfully');
        } catch (error) {
            console.log('Some login elements not loaded:', error.message);
           
        }
    }

    async login(username, password) {
        try {
            await this.fill(this.usernameInput, username);
            await this.fill(this.passwordInput, password);
            
            // Click login and wait for navigation using Promise.all
            await Promise.all([
                this.page.waitForNavigation({ 
                    timeout: 30000, 
                    waitUntil: 'domcontentloaded' 
                }).catch(e => {
                    console.log('Navigation wait completed or timed out');
                }),
                this.click(this.loginButton)
            ]);
            
            console.log('Login form submitted and navigation triggered');
        } catch (error) {
            console.error('Login failed:', error.message);
            
            try {
                await this.click(this.loginButton);
                await this.waitForTimeout(3000);
            } catch (clickError) {
                console.log('Alternative click also failed:', clickError.message);
            }
        }
    }

    async isLoginPageDisplayed() {
        return await this.isVisible(this.loginLogo);
    }

    async getErrorMessage() {
        if (await this.isVisible(this.errorMessage)) {
            return await this.getText(this.errorMessage);
        }
        return null;
    }

    
    async isLoginSuccessful() {
        try {
           
            const currentUrl = this.page.url();
            if (currentUrl.includes('dashboard')) {
                return true;
            }
            
            
            const dashboardHeader = await this.page.$('h6:has-text("Dashboard")');
            return !!dashboardHeader;
        } catch {
            return false;
        }
    }
}

module.exports = LoginPage;