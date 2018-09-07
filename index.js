const pti = require('puppeteer-to-istanbul');
const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const dateFormat = require('dateformat');

const today = new Date();
const deviceName = 'iPhone 6';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.emulate(devices[deviceName]);
 
    await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage()
    ]);

    await page.goto('https://www.vistaprint.com/?GP=09%2f07%2f2018+13%3a16%3a03&GPS=5161543330&GNF=0');
    await page.screenshot({path: './screenshots/' + deviceName + '-' + dateFormat(today, "yyyymmdd") + '.png', fullPage: true});

    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
    ]);
    try {
        pti.write(jsCoverage);
    } catch(err) {
        console.warn("Failed to write istanbul report:");
        console.warn(err.name + ": " + err.message);
    }

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