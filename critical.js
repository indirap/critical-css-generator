const critical = require('critical');

const basePath = 'dist/';
console.log('Running critical...');

critical.generate({
    base: `${basePath}`,
    src: 'index.html',
    dest: `${basePath}styles/main.css`,
    width: 1300,
    height: 900,
    timeout: 100000
});