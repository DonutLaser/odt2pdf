const odt2pdf = require('./index');
const fs = require('fs').promises;

async function start() {
    const result = await odt2pdf('test1.odt');

    if (result) { await fs.writeFile('result.pdf', result); }
}

start();