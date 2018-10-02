# Critical CSS

Extract critical css (above the fold) from a specific site using puppeteer.

### Usage

1) `npm i https://s3-eu-west-1.amazonaws.com/vp-critical-css/critical-css-0.0.1.tgz`
2) Run the following:
```
const criticalCss = require('critical-css').criticalCss;
critical.generate({
    url: 'https://www.vistaprint.com/business-cards',
    path: 'critical-business-cards.css',
    viewport: true
});
```
3) A `critical-business-cards.css` file will be generated. Add this into the page!

Options include:
* url: URL to get critical CSS for.
* path: Where to output critical CSS. Default is `critical.css`.
* deviceName: What device to run it on. Default is Pixel 2.
* waitFor: How long to wait after page navigation before generating critical CSS. Some pages have long load times, so specifying this may be helpful. Default is 20 seconds.
* viewport: Whether to generate critical CSS (only above the fold content) or generate used CSS for the whole page. Default is true.
* cssSelectorFilter: An array of CSS selectors (regex) to always include in the generated CSS. For example: [/mobile/]. Default is [].