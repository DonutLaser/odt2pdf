function xml2js(xml) {
    const result = {
        styles: {},
        text: [],
    };

    xml.childNamed('office:automatic-styles').eachChild((child) => {
        const styleName = child.attr['style:name'];
        const textPropertiesStyle = child.childNamed('style:text-properties');

        let fontSize;
        if (textPropertiesStyle) {
            fontSize = parseInt(textPropertiesStyle.attr['fo:font-size'].replace(/pt/g, ''), 10);
        }

        result.styles[styleName] = { fontSize };
    });

    xml.childNamed('office:body').childNamed('office:text').childrenNamed('text:p').forEach((node) => {
        const textNodes = node.childrenNamed('text:span');
        const values = textNodes.map(n => ({ value: n.val, style: n.attr['text:style-name'] }));

        if (values && values.length > 0) { result.text.push(values); }
    });

    return result;
}

module.exports = xml2js;
