# Usage

1) `npm i https://s3-eu-west-1.amazonaws.com/vp-critical-css/critical-css-0.0.1.tgz`
2) Run the following:
```
const criticalCss = require('critical-css').criticalCss;
criticalCss.generate({
    url: 'https://www.vistaprint.com/business-cards/rounded-corner/templates'
});
```
3) A `critical.css` file will be generated. Add this into the page!

Options include:
* url: URL to get critical CSS for.
* path: Where to output critical CSS. Default is `critical.css`.
* deviceName: What device to run it on. Default is Pixel 2.
* waitFor: How long to wait after page navigation before generating critical CSS. Default is 20 seconds.