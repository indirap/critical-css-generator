const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const deviceName = 'Pixel 2';
const fs = require('fs');
const CleanCSS = require('clean-css');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.emulate(devices[deviceName]);
    page.setDefaultNavigationTimeout(20000);

    await Promise.all([
        page.coverage.startCSSCoverage()
    ]);

    await page.goto('https://www.vistaprint.com/business-cards/rounded-corner/templates', {
        timeout: 100000
    });

    await page.waitFor(20000);
    
    const [cssCoverage] = await Promise.all([
        page.coverage.stopCSSCoverage()
    ]);

    let newCssString = "";
    for (const entry of cssCoverage) {
        console.log(entry.url);
        
        entry.ranges.forEach((range) => {
            newCssString += entry.text.substring(range.start, range.end) + "\n";
        });
    }
    newCssString += "body{width:100vw}";
    const minifiedCss = new CleanCSS({ compatibility: '*' }).minify(newCssString).styles;
    fs.writeFileSync(`SUCCESS.css`, minifiedCss, 'utf8');
    
    await browser.close();
})();