const fs = require('fs').promises;
const JSZIP = require('jszip');
const xmldoc = require('xmldoc');
const xml2js = require('./xml2js');
const PDFDocument = require('pdfkit');

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
    const document = xml2js(contentsXml); // Convert xml structure to json for easier handling

    const buffers = [];
    const result = await new Promise((resolve) => {
        const doc = new PDFDocument({ bufferPages: true });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => { resolve(Buffer.concat(buffers)); });

        doc.font('Times-Roman');
        document.text.forEach((line) => {
            line.forEach((text, index) => {
                doc.fontSize(document.styles[text.style].fontSize);
                doc.text(text.value, { lineBrak: index < line.length - 1 });
            });
        });

        doc.end();
    });

    return result;
}

module.exports = odt2pdf;
