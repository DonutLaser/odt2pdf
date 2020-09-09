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
        doc.registerFont('Times', 'fonts/times.ttf');
        doc.registerFont('Times Bold', 'fonts/timesbd.ttf');

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => { resolve(Buffer.concat(buffers)); });

        document.text.forEach((line) => {
            line.forEach((text, index) => {
                const style = { ...document.styles[text.style], ...document.styles[text.paragraphStyle] };
                // const style = text.style ? document.styles[text.style] : null;
                const font = style.bold ? 'Times Bold' : 'Times';
                doc.font(font);

                if (style.fontSize) { doc.fontSize(style.fontSize); }
                doc.text(text.value, { continued: index < line.length - 1, align: style.alignment || 'left' });
            });
        });

        doc.end();
    });

    return result;
}

module.exports = odt2pdf;
