const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const CleanCSS = require('clean-css');
const cssMinifier = new CleanCSS({ compatibility: '*' });
const cssSelectorExtract = require('css-selector-extract');
const urlParse = require('url-parse');
const css = require('css');

exports.generate = (async (opts) => {
    const options = Object.assign({
        deviceName: 'Pixel 2',
        waitFor: 20000,
		path: 'critical.css',
		viewport: true,
        cssSelectorFilter: [],
        excludeCssFiles: [],
        includeCssFiles: [],
        generateSeparateFiles: false
    }, opts);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.emulate(devices[options.deviceName]);
    await page.coverage.startCSSCoverage();

    await page.goto(options.url, {
        timeout: 100000
    });

    await page.waitFor(options.waitFor);
    
    const [cssCoverage] = await Promise.all([
        page.coverage.stopCSSCoverage()
    ]);

    let criticalCss = '';
    const criticalCssByUrl = {};
    for (const entry of cssCoverage) {
        const url = urlParse(entry.url, true);
        if (options.includeCssFiles.find((cssFile) => cssFile.test(entry.url))) {
            criticalCss += '/*' + url.pathname + '*/ \n';
            criticalCss += entry.text;
            criticalCssByUrl[url.pathname] += entry.text;
        } else if (entry.ranges.length > 0) {
            if (!options.excludeCssFiles.find((cssFile) => cssFile.test(entry.url))) {
                criticalCss += '/*' + url.pathname + "*/ \n";
                criticalCssByUrl[url.pathname] = '';
                entry.ranges.forEach((range) => {
                    const str = entry.text.substring(range.start, range.end).replace("url('", `url('${url.origin}`) + "\n";
                    criticalCss += str;
                    criticalCssByUrl[url.pathname] += str;
                });
            }
        }
    }
    criticalCss += "body{width:100vw}";

    if (options.viewport) {
        // Get all CSS selectors from minified string
        var criticalStyles = css.parse(criticalCss);
        
        const cssSelectors = [];
        criticalStyles.stylesheet.rules
            .filter((selectorElem) => selectorElem.type == 'rule')
            .forEach((selectorElem) => selectorElem.selectors.forEach((elem) => cssSelectors.push(elem)));
        cssSelectors
            .filter((cssSelector, index, self) => self.indexOf(cssSelector) === index)
            .map((cssSelector) => cssSelector.trim());

        // Get all elements with CSS selectors above
        const elementsBySelector = {};
        let promises = [];
        cssSelectors.forEach((cssSelector) => {
            promises.push(
                page
                    .$$(cssSelector)
                    .then((elements) => {
                        elementsBySelector[cssSelector] = elements;
                    })
                    .catch((err) => {
                        console.error(err);
                    })
            )
        });
        await Promise.all(promises);

        // For each selector, check if they have elements in the viewport
        promises = [];
        const criticalCssSelectors = [];
        Object.keys(elementsBySelector).forEach((cssSelector) => {
            elementsBySelector[cssSelector].forEach((element) => {
                promises.push(
                    element
                        .isIntersectingViewport()
                        .then((isIntersectingViewport) => {
                            if (isIntersectingViewport && !criticalCssSelectors.includes(cssSelector)) {
                                criticalCssSelectors.push(cssSelector);
                            }
                        })
                        .catch((err) => {
                            console.error(err);
                        })
                );
            });
        });
        await Promise.all(promises);

        // Just add all with the following selectors in the name
        Object.keys(elementsBySelector).forEach((cssSelector) => {
            if (options.cssSelectorFilter.length > 0) {
                if (options.cssSelectorFilter.find((filter) => !criticalCssSelectors.includes(cssSelector) && filter.test(cssSelector))) {
                    criticalCssSelectors.push(cssSelector.trim());
                }
            }
        });

        const cssSelectorExtractOptions = {
            css: criticalCss,
            filters: criticalCssSelectors
        };
        await cssSelectorExtract.process(cssSelectorExtractOptions)
            .then((extractedCss) => {
                criticalCss = extractedCss;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    let promises = [
        (new Promise((resolve, reject) => {
            const minifiedCss = cssMinifier.minify(criticalCss).styles;
            fs.writeFile(options.path, minifiedCss, 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }))
    ];

    if (options.generateSeparateFiles) {
        Object.keys(criticalCssByUrl).forEach((url) => promises.push(
            (new Promise((resolve, reject) => {
                const arr = url.split('/');
                const fileName = arr[arr.length - 1];
                const minifiedCss = cssMinifier.minify(criticalCssByUrl[url]).styles;
                fs.writeFile(`critical/${fileName}`, minifiedCss, 'utf8', (err) => {
                    if (err) {
                        console.warn(err);
                        resolve();
                    } else {
                        resolve();
                    }
                });
            })))
        );
    }
    
    await Promise.all(promises);
    
    await browser.close();
});