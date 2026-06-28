const puppeteer = require('puppeteer');
const fs = require('fs');

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const page = await browser.newPage();
  
  // Login
  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', 'admin@sigp.ci');
  await page.type('input[name="mot_de_passe"]', 'Admin@2026');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for navigation to dashboard...');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Navigate to Projects Page
  console.log('Navigating to projects page...');
  await page.goto('http://localhost:5173/projects', { waitUntil: 'networkidle2' });
  
  const destDir = 'C:\\\\Users\\\\Baba Traore\\\\.gemini\\\\antigravity-ide\\\\brain\\\\02c01e5d-5751-4142-a2fc-900a57c73d41';

  for (const vp of viewports) {
    console.log(`Taking screenshot for ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 1000)); // Wait for reflow
    await page.screenshot({ path: `${destDir}\\\\screenshot_${vp.name}_projects.png`, fullPage: false });
  }

  // Navigate to Project Detail Page
  console.log('Navigating to project detail page...');
  await page.goto('http://localhost:5173/projects/14', { waitUntil: 'networkidle2' });
  
  // Click on Risks tab to capture the migrated TabRisks
  try {
    const tabs = await page.$$('button, a, div[role="tab"]');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.toLowerCase().includes('risques')) {
        await tab.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  } catch (e) {
    console.log('Could not find risks tab');
  }

  for (const vp of viewports) {
    console.log(`Taking screenshot for ${vp.name} on detail page...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 1000)); // Wait for reflow
    await page.screenshot({ path: `${destDir}\\\\screenshot_${vp.name}_detail_risks.png`, fullPage: false });
  }

  await browser.close();
  console.log('Done!');
}

takeScreenshots().catch(console.error);
