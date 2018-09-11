const penthouse = require('penthouse');
const fs = require('fs');

penthouse({
    forceInclude: [],
    timeout: 600000,
    url: 'file://C:\\Users\\ipranabudi\\Documents\\git\\critical-css\\dist\\index.html',
    css: 'all.css',
    userAgent: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 10 Build/MOB31T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3452.0 Safari/537.36'
})
.then(criticalCss => {
    fs.writeFileSync('penthouse.css', criticalCss);
});