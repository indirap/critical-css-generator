const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.emulate(devices['iPhone 6']);

    await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage()
    ]);
    
    await page.goto('https://www.vistaprint.com');
    await page.screenshot({path: 'iPhone6.png', fullPage: true});
    
    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
    ]);
    
    let totalBytes = 0;
    let usedBytes = 0;
    const coverageObj = {};
    const coverage = [...jsCoverage, ...cssCoverage];
    for (const entry of coverage) {
        totalBytes += entry.text.length;
        let entryBytes = 0;
        for (const range of entry.ranges) {
            usedBytes += range.end - range.start - 1;
            entryBytes += range.end - range.start - 1;
        }

        coverageObj[entry.url] = {
            total: entry.text.length,
            used: entryBytes
        };
    }

    console.log(`Bytes used: ${usedBytes / totalBytes * 100}%`);
    fs.writeFileSync('coverage.json', JSON.stringify(coverageObj), 'utf8');

    await browser.close();
})();