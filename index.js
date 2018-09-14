const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const CleanCSS = require('clean-css');

exports.generate = (async (opts) => {
    const options = Object.assign({
        deviceName: 'Pixel 2',
        waitFor: 20000,
        path: 'critical.css'
    }, opts);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.emulate(devices[options.deviceName]);

    await Promise.all([
        page.coverage.startCSSCoverage()
    ]);

    await page.goto(options.url, {
        timeout: 100000
    });

    await page.waitFor(options.waitFor);
    
    const [cssCoverage] = await Promise.all([
        page.coverage.stopCSSCoverage()
    ]);

    let cssString = "";
    for (const entry of cssCoverage) {        
        entry.ranges.forEach((range) => {
            cssString += entry.text.substring(range.start, range.end) + "\n";
        });
    }
    cssString += "body{width:100vw}";

    const minifiedCss = new CleanCSS({ compatibility: '*' }).minify(cssString).styles;
    fs.writeFileSync(options.path, minifiedCss, 'utf8');
    
    await browser.close();
});