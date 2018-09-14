const devices = require('puppeteer/DeviceDescriptors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const dateFormat = require('dateformat');

const today = new Date();
const deviceName = 'Pixel 2';
const path = require('path');

const basePath = 'dist';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.emulate(devices[deviceName]);
    page.setDefaultNavigationTimeout(100000);

    await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage()
    ]);

    await page.goto('https://www.vistaprint.com', {
        timeout: 100000
    });
    // await page.screenshot({path: './screenshots/' + deviceName + '-' + dateFormat(today, "yyyymmdd") + '.png', fullPage: true});
    
    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
    ]);

    let totalBytes = 0;
    let usedBytes = 0;
    const coverageObj = {};

    for (const entry of jsCoverage) {
        if (entry.url.indexOf('https://www.vistaprint.com') >= 0 && entry.url.indexOf('?') < 0) {
            const pathName = path.normalize(`${basePath}${entry.url.replace('https://www.vistaprint.com', '')}`);
            const dirName = path.dirname(pathName);
            if (!fs.existsSync(dirName)) {
                const dirs = dirName.split(path.sep);
                let currentDirName = '.';
                dirs.forEach((dir) => {
                    currentDirName = path.join(currentDirName, dir);
                    if (!fs.existsSync(currentDirName)) {
                        fs.mkdirSync(currentDirName);
                    }
                });
            }
            fs.writeFileSync(pathName, entry.text);
        }
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

    for (const entry of cssCoverage) {
        if (entry.url.indexOf('https://www.vistaprint.com') >= 0 && entry.url.indexOf('?GP=') < 0) {
            let pathName = path.normalize(`${basePath}${entry.url.replace('https://www.vistaprint.com', '')}`);
            if (pathName.indexOf('?') >= 0) {
                pathName = pathName.split('?')[0];
            }
            const dirName = path.dirname(pathName);
            if (!fs.existsSync(dirName)) {
                const dirs = dirName.split(path.sep);
                let currentDirName = '.';
                dirs.forEach((dir) => {
                    currentDirName = path.join(currentDirName, dir);
                    if (!fs.existsSync(currentDirName)) {
                        fs.mkdirSync(currentDirName);
                    }
                });
            }
            fs.writeFileSync(pathName, entry.text);
            fs.writeFileSync(`${pathName}-coverage.json`, JSON.stringify(entry), 'utf8');
        }
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

    await page.content()
        .then((content) => {
            fs.writeFileSync(`${basePath}/index.html`, content);
        })
        .catch((err) => {
            console.error(err);
        });
    
    await browser.close();
})();