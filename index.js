const fs = require('fs').promises;
const JSZIP = require('jszip');
const xmldoc = require('xmldoc');
const xml2js = require('./xml2js');

async function odt2pdf(pathToOdt) {
    const file = await fs.readFile(pathToOdt);
    const jszip = new JSZIP();
    const zip = await jszip.loadAsync(file);

    if (!Object.keys(zip.files).includes('content.xml')) {
        console.log('Error: .odt file doesn\'t contain "content.xml" file');
        return null;
    }

    const contents = await zip.file('content.xml').async('nodebuffer');
    const contentsXml = new xmldoc.XmlDocument(contents);
    const document = xml2js(contentsXml);

    return null;
}

module.exports = odt2pdf;