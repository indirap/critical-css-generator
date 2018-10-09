# Critical CSS Generator

Extract critical css (above the fold) for a specific site using puppeteer.

### Usage

1) `npm i critical-css-generator`
2) Run the following:
```
const critical = require('critical-css-generator');
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
* deviceName: What device to run it on. Default is `Pixel 2`.
* waitFor: How long to wait (in ms) after page navigation before generating critical CSS. Some pages have long load times, so specifying this may be helpful. Default is `20000`.
* viewport: Whether to generate critical CSS (only above the fold content) or generate used CSS for the whole page. Default is `true`.
* cssSelectorFilter: An array of CSS selectors (regex) to always include in the generated CSS. For example: [/mobile/]. Default is `[]`.
* includeCssFiles: An array of CSS file names (regex) to always include in the generated CSS. Default is `[]`.
* excludeCssFiles: An array of CSS file names (regex) to always exclude in the generated CSS. Default is `[]`.
* generateSeparateFiles: Generate separate critical CSS files per each CSS file used. The files are stored in a `critical/` directory. Default is `false`.
