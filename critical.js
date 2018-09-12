const critical = require('critical');

const basePath = 'dist/';
console.log('Running critical...');

critical.generate({
    base: `${basePath}`,
    src: 'index.html',
    dest: 'critical.css',
    timeout: 300000,
    width: 800,
    height: 1280,
    userAgent: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 10 Build/MOB31T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3452.0 Safari/537.36'
});