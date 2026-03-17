const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
    constructor(page) {
        super(page);
        
        // Dashboard locators

        this.dashboardHeader = 'h6:has-text("Dashboard")';
        this.adminTab = 'a:has-text("Admin")';
        this.pimTab = 'a:has-text("PIM")';
        this.profileName = '.oxd-userdropdown-name';
        this.userDropdown = '.oxd-userdropdown-tab';
        
        // PIM Module locators

        this.employeeTable = '.oxd-table-body';
        this.employeeRows = '.oxd-table-body .oxd-table-row';
        this.employeeNameCells = '.oxd-table-body .oxd-table-cell:nth-child(3)';
        this.employeeStatusCells = '.oxd-table-body .oxd-table-cell:nth-child(5)';
        this.loadingSpinner = '.oxd-loading-spinner';
    }

    async waitForDashboardLoad() {
        try {
            await Promise.all([
                this.waitForElement(this.dashboardHeader, 'visible', 30000),
                this.waitForElement(this.adminTab, 'visible', 30000),
                this.waitForElement(this.pimTab, 'visible', 30000),
                this.waitForElement(this.profileName, 'visible', 30000)
            ]);
            
            // Wait for any loading spinners to disappear

            try {
                await this.page.waitForSelector(this.loadingSpinner, { 
                    state: 'hidden', 
                    timeout: 10000 
                });
            } catch {
                // Loading spinner might not be present, continue
            }
        } catch (error) {
            console.error('Error waiting for dashboard load:', error.message);
            throw error;
        }
    }

    async validateDashboardElements() {
        const elements = {
            dashboardHeader: await this.isVisible(this.dashboardHeader),
            adminTab: await this.isVisible(this.adminTab),
            pimTab: await this.isVisible(this.pimTab),
            profileName: await this.isVisible(this.profileName)
        };
        
        return elements;
    }

    async clickPIMModule() {
        try {
            await this.click(this.pimTab);//
            await this.page.waitForTimeout(2000);

            // Wait for employee table to be visible

            await this.waitForElement(this.employeeRows, 'visible', 10000).catch(() => {
                console.log('Employee table not immediately available, continuing...');
            });
        } catch (error) {
            console.error('Error clicking PIM module:', error.message);
            throw error;
        }
    }

    async getEmployeeNamesAndStatusEnhanced(count = 5) {
    try {
        let rows = [];
        let retries = 3;
        
        while (retries > 0 && rows.length === 0) {
            try {
                await this.waitForElement(this.employeeRows, 'visible', 5000);
                rows = await this.page.$$(this.employeeRows);
            } catch {
                console.log(`Retry ${4 - retries}: Waiting for employee rows...`);
            }
            retries--;
            if (rows.length === 0 && retries > 0) {
                await this.page.waitForTimeout(2000);
            }
        }
        
        console.log(`Found ${rows.length} employee rows`);
        
        const employees = [];
        const maxCount = Math.min(count, rows.length);
        
        // Get table headers to understand column structure

        const headerCells = await this.page.$$('.oxd-table-header .oxd-table-cell');
        const headers = [];
        for (const cell of headerCells) {
            const text = await cell.textContent();
            headers.push(text?.trim() || '');
        }
        console.log('Table headers:', headers);
        
        for (let i = 0; i < maxCount; i++) {
            try {
                const row = rows[i];
                const cells = await row.$$('.oxd-table-cell');
                
                const cellContents = [];
                for (let j = 0; j < cells.length; j++) {
                    const cellText = await cells[j].textContent();
                    cellContents.push(cellText?.trim() || '');
                }
                
                console.log(`Row ${i + 1} cell contents:`, cellContents);
                
                // Extract name (typically 3rd column, index 2)

                let name = cellContents[2] || '';
                let status = '';
                
                // Search for status keywords in columns 3+

                for (let j = 3; j < cellContents.length; j++) {
                    const cell = cellContents[j].toLowerCase();
                    if (cell.includes('full-time') || 
                        cell.includes('part-time') || 
                        cell.includes('contract') || 
                        cell.includes('permanent') ||
                        cell.includes('intern') ||
                        cell.includes('temporary')) {
                        status = cellContents[j];
                        console.log(`Found status at column ${j}: "${status}"`);
                        break;
                    }
                }
                
                // Fallback to column 4 if not found
                
                if (!status && cells.length > 4) {
                    status = cellContents[4];
                }
                
                employees.push({
                    name: name || '',
                    status: status || ''
                });
                
            } catch (rowError) {
                console.log(`Error extracting row ${i + 1}:`, rowError.message);
                employees.push({ name: '', status: '' });
            }
        }
        
        return employees;
        
    } catch (error) {
        console.error('Error getting employee data:', error.message);
        return [];
    }
}
}

module.exports = DashboardPage;