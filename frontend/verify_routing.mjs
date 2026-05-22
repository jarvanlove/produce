import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Navigate to login
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Work/note/CursorWorkSpace/produce/frontend/verify_login.png' });
  console.log('Screenshot 1: login page saved');

  // 2. Login via evaluate
  await page.evaluate(({ username, password }) => {
    const userInput = document.querySelector('input[type="text"], input[placeholder*="账号"], input[name="username"]');
    const pwdInput = document.querySelector('input[type="password"], input[placeholder*="密码"], input[name="password"]');
    if (userInput) userInput.value = username;
    if (pwdInput) pwdInput.value = password;
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  }, { username: 'T2024001', password: 'admin' });

  // Wait for navigation after login
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Work/note/CursorWorkSpace/produce/frontend/verify_after_login.png' });
  console.log('Screenshot 2: after login saved');

  // 3. Click 数据导入
  const importLink = await page.locator('text=数据导入').first();
  if (importLink) await importLink.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Work/note/CursorWorkSpace/produce/frontend/verify_import.png' });
  console.log('Screenshot 3: import page saved');

  // 4. Click 学情仪表盘
  const dashboardLink = await page.locator('text=学情仪表盘').first();
  if (dashboardLink) await dashboardLink.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Work/note/CursorWorkSpace/produce/frontend/verify_dashboard.png' });
  console.log('Screenshot 4: dashboard page saved');

  // 5. Click 学生画像
  const studentsLink = await page.locator('text=学生画像').first();
  if (studentsLink) await studentsLink.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Work/note/CursorWorkSpace/produce/frontend/verify_students.png' });
  console.log('Screenshot 5: students page saved');

  await browser.close();
  console.log('Done');
})();
