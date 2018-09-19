const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const CleanCSS = require('clean-css');
const cssSelectorExtract = require('css-selector-extract');

exports.generate = (async (opts) => {
    const options = Object.assign({
        deviceName: 'Pixel 2',
        waitFor: 20000,
        path: 'critical.css',
        cssSelectorFilter: []
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

    let criticalCss = "";
    for (const entry of cssCoverage) {
        entry.ranges.forEach((range) => {
            criticalCss += entry.text.substring(range.start, range.end) + "\n";
        });
    }
    criticalCss += "body{width:100vw}";

    if (options.viewport) {
        // Get all CSS selectors from minified string
        const cssSelectorRegex = /(\.)([\w-.\: ]+)/g; // TODO narrow down regex to not catch width and transition measurements (eg .25em)
        const cssSelectors = criticalCss.match(cssSelectorRegex).filter((cssSelector, index, self) => self.indexOf(cssSelector) === index).map((cssSelector) => cssSelector.trim());

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
                        // console.error(err); // so noisy, pls just shut up
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

        // Just add all that have "header" in the name
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

    const minifiedCss = new CleanCSS({ compatibility: '*' }).minify(criticalCss).styles;
    fs.writeFileSync(options.path, minifiedCss, 'utf8');
    
    await browser.close();
});