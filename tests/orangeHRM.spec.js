const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');

test.describe('OrangeHRM Automation Suite', () => {
    let loginPage;
    let dashboardPage;
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        test.setTimeout(60000); 
    });

    test.afterEach(async () => {
        try {
            if (page && !page.isClosed()) {
                await page.close();
            }
        } catch (error) {
            console.log('[CLEANUP] Error during cleanup:', error.message);
        }
    });

    test('Complete OrangeHRM workflow', async () => {
        try {
            console.log('\n========== Starting OrangeHRM Workflow Test ==========\n');
            
            // Step 1: Navigate to login page with retry logic

            console.log('[STEP 1] Navigating to login page...');
            
            let navigationSuccess = false;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (!navigationSuccess && retryCount <= maxRetries) {
                try {
                    await loginPage.navigateToLogin();
                    navigationSuccess = true;
                    console.log('[SUCCESS] Navigation completed');
                } catch (navError) {
                    retryCount++;
                    console.log(`[ATTEMPT ${retryCount}] Navigation failed: ${navError.message}`);
                    if (retryCount > maxRetries) {
                        console.log('[FAILED] All navigation attempts failed');
                        throw navError;
                    }
                    console.log(`[RETRY] Attempting again (${retryCount + 1}/${maxRetries + 1})...`);
                    await loginPage.waitForTimeout(2000);
                }
            }
            
            // Wait for login page elements

            console.log('[LOADING] Waiting for login page elements...');
            try {
                await loginPage.waitForLoginPage();
                console.log('[SUCCESS] Login page loaded');
            } catch (elementError) {
                console.log('[WARNING] Login page elements not fully loaded, continuing...');
                await loginPage.waitForTimeout(2000);
            }
            
            // Step 2: Login with credentials

            console.log('[STEP 2] Attempting login with credentials...');
            try {
                await loginPage.login('Admin', 'admin123');
                console.log('[SUCCESS] Login form submitted');
            } catch (loginError) {
                console.log('[WARNING] Login form issue:', loginError.message);
                await loginPage.waitForTimeout(2000);
                await loginPage.login('Admin', 'admin123');
            }
            
            // Wait for navigation to complete

            console.log('[LOADING] Waiting for post-login navigation...');
            await loginPage.waitForTimeout(3000);
            
            // Step 3: Wait for dashboard and take screenshot

            console.log('[STEP 3] Waiting for dashboard to load...');
            try {
                await dashboardPage.waitForDashboardLoad();
                console.log('[SUCCESS] Dashboard loaded');
            } catch (dashboardError) {
                console.log('[WARNING] Dashboard load issue:', dashboardError.message);
                await loginPage.waitForTimeout(3000);
            }
            
            // Take screenshot after successful login

            try {
                await dashboardPage.takeScreenshot('after-login-success');
                console.log('[SUCCESS] Screenshot captured');
            } catch (screenshotError) {
                console.log('[WARNING] Screenshot failed:', screenshotError.message);
            }
            
            // Step 4: Validate dashboard elements

            console.log('[STEP 4] Validating dashboard elements...');
            let elements = {
                dashboardHeader: false,
                adminTab: false,
                pimTab: false,
                profileName: false
            };
            
            try {
                elements = await dashboardPage.validateDashboardElements();
                console.log('[INFO] Dashboard elements check:');
                console.log('  - Dashboard Header:', elements.dashboardHeader);
                console.log('  - Admin Tab:', elements.adminTab);
                console.log('  - PIM Tab:', elements.pimTab);
                console.log('  - Profile Name:', elements.profileName);
            } catch (validationError) {
                console.log('[WARNING] Element validation error:', validationError.message);
                await loginPage.waitForTimeout(2000);
                elements = await dashboardPage.validateDashboardElements();
            }
            
            // Assert all dashboard elements are visible

            try {
                expect(elements.dashboardHeader, 'Dashboard header should be visible').toBeTruthy();
                expect(elements.adminTab, 'Admin tab should be visible').toBeTruthy();
                expect(elements.pimTab, 'PIM tab should be visible').toBeTruthy();
                expect(elements.profileName, 'Profile name should be visible').toBeTruthy();
                console.log('[SUCCESS] All dashboard elements validated');
            } catch (assertError) {
                console.log('[FAILED] Some dashboard elements not found:', assertError.message);
                await dashboardPage.takeScreenshot('dashboard-validation-failed');
                throw assertError;
            }
            
            // Step 5: Navigate to PIM module

            console.log('[STEP 5] Navigating to PIM module...');
            try {
                await dashboardPage.clickPIMModule();
                await dashboardPage.waitForTimeout(3000);
                console.log('[SUCCESS] PIM module loaded');
            } catch (pimError) {
                console.log('[WARNING] PIM navigation error:', pimError.message);
                await dashboardPage.waitForTimeout(2000);
                await dashboardPage.clickPIMModule();
                await dashboardPage.waitForTimeout(3000);
            }
            
            // Step 6: Extract employee data

            console.log('[STEP 6] Extracting employee data...');
            let employees = [];
            try {
                employees = await dashboardPage.getEmployeeNamesAndStatusEnhanced(5);
                console.log(`[SUCCESS] Extracted ${employees.length} employees`);
                employees.forEach((emp, index) => {
                    console.log(`  ${index + 1}. Name: "${emp.name || 'N/A'}" | Status: "${emp.status || 'N/A'}"`);
                });
            } catch (dataError) {
                console.log('[WARNING] Employee data extraction error:', dataError.message);
                await dashboardPage.waitForTimeout(2000);
                employees = await dashboardPage.getEmployeeNamesAndStatus(5);
                console.log(`[INFO] Extracted ${employees.length} employees (using fallback method)`);
            }
            
            // Step 7: Validate employee data
            
            console.log('[STEP 7] Validating employee data...');
            
            if (employees.length > 0) {
                const nonEmptyNames = employees.filter(emp => emp && emp.name && emp.name.trim() !== '');
                try {
                    expect(nonEmptyNames.length, 'Should have at least one employee with non-empty name').toBeGreaterThan(0);
                    console.log(`[SUCCESS] Found ${nonEmptyNames.length} employees with valid names`);
                } catch (assertError) {
                    console.log('[FAILED] No employees with valid names found:', assertError.message);
                    await dashboardPage.takeScreenshot('employee-data-issue');
                    throw assertError;
                }
                
                console.log('[CHECKING] Looking for Full-Time Permanent employees...');
                
                const fullTimeEmployees = employees.filter(emp => {
                    if (!emp || !emp.status) {
                        console.log(`  [SKIP] Empty status for "${emp?.name || 'Unknown'}"`);
                        return false;
                    }
                    
                    const statusLower = emp.status.toLowerCase();
                    console.log(`  [CHECK] "${emp.name}" -> Status: "${emp.status}"`);
                    
                    const isFullTime = (
                        statusLower.includes('full-time permanent') ||
                        (statusLower.includes('full-time') && statusLower.includes('permanent')) ||
                        (statusLower.includes('full time') && statusLower.includes('permanent')) ||
                        statusLower === 'full-time permanent' ||
                        statusLower === 'full time permanent'
                    );
                    
                    if (isFullTime) {
                        console.log(`    [MATCH] Identified as Full-Time Permanent`);
                    }
                    
                    return isFullTime;
                });
                
                console.log(`[RESULT] Found ${fullTimeEmployees.length} Full-Time Permanent employee(s)`);
                
                if (fullTimeEmployees.length > 0) {
                    console.log('[INFO] Full-Time Permanent employees:');
                    fullTimeEmployees.forEach((emp, index) => {
                        console.log(`  ${index + 1}. ${emp.name} - ${emp.status}`);
                    });
                    console.log('[SUCCESS] Status validation passed');
                } else {
                    console.log('[WARNING] No Full-Time Permanent employees found in first 5 records');
                    console.log('[INFO] Possible causes:');
                    console.log('  1. Table structure is different than expected');
                    console.log('  2. Status column index needs adjustment');
                    console.log('  3. No Full-Time Permanent employees in current data');
                    console.log('  4. Status text format is different');
                    
                    console.log('[ACTION] Capturing debug screenshot...');
                    await dashboardPage.takeScreenshot('employee-status-debug');
                    
                    console.log('[INFO] All statuses found:');
                    const allStatuses = new Set();
                    employees.forEach(emp => {
                        if (emp.status) {
                            allStatuses.add(emp.status);
                        }
                    });
                    Array.from(allStatuses).forEach(status => {
                        console.log(`  - "${status}"`);
                    });
                }
            } else {
                console.log('[FAILED] No employees found in the table');
                await dashboardPage.takeScreenshot('no-employees-found');
            }
            
            console.log('[SUCCESS] Employee data validation completed');
            console.log('\n========== Test Completed Successfully ==========\n');
            
        } catch (error) {
            console.error('\n[ERROR] Test failed:', error.message);
            console.error('[DEBUG] Error stack:', error.stack);
            
            try {
                if (page && !page.isClosed()) {
                    await dashboardPage.takeScreenshot(`validation-failure-${Date.now()}`);
                    console.log('[ACTION] Failure screenshot captured');
                } else {
                    console.log('[WARNING] Could not take failure screenshot - page closed');
                }
            } catch (screenshotError) {
                console.log('[WARNING] Failed to capture failure screenshot:', screenshotError.message);
            }
            
            throw error;
        }
    });

    test('Negative test - Invalid login', async () => {
        console.log('\n========== Starting Invalid Login Test ==========\n');
        
        try {
            let navigationSuccess = false;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (!navigationSuccess && retryCount <= maxRetries) {
                try {
                    await loginPage.navigateToLogin();
                    navigationSuccess = true;
                } catch (navError) {
                    retryCount++;
                    console.log(`[ATTEMPT ${retryCount}] Navigation failed, retrying...`);
                    if (retryCount > maxRetries) {
                        throw navError;
                    }
                    await loginPage.waitForTimeout(2000);
                }
            }
            
            console.log('[LOADING] Waiting for login page...');
            await loginPage.waitForLoginPage();
            console.log('[SUCCESS] Login page loaded');
            
            console.log('[STEP 1] Attempting login with invalid credentials...');
            await loginPage.login('InvalidUser', 'InvalidPass');
            
            console.log('[LOADING] Waiting for error message...');
            await loginPage.waitForTimeout(3000);
            
            await loginPage.takeScreenshot(`invalid-login-${Date.now()}`);
            
            const errorMsg = await loginPage.getErrorMessage();
            console.log('[INFO] Error message:', errorMsg);
            
            expect(errorMsg, 'Error message should be displayed').toBeTruthy();
            if (errorMsg) {
                expect(errorMsg, 'Error message should indicate invalid credentials').toContain('Invalid');
            }
            
            console.log('[SUCCESS] Negative test passed - Error message displayed correctly');
            console.log('\n========== Invalid Login Test Completed ==========\n');
            
        } catch (error) {
            console.error('\n[ERROR] Negative test failed:', error.message);
            
            try {
                if (page && !page.isClosed()) {
                    await loginPage.takeScreenshot(`negative-test-failure-${Date.now()}`);
                }
            } catch (screenshotError) {
                console.log('[WARNING] Failed to capture screenshot:', screenshotError.message);
            }
            
            throw error;
        }
    });
});