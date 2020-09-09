function xml2js(xml) {
    const result = {
        styles: {},
        text: [],
    };

    xml.childNamed('office:automatic-styles').eachChild((child) => {
        const styleName = child.attr['style:name'];
        const textPropertiesStyle = child.childNamed('style:text-properties');
        const paragraphPropertiesStyle = child.childNamed('style:paragraph-properties');

        result.styles[styleName] = {};

        if (textPropertiesStyle) {
            result.styles[styleName].fontSize = parseInt(textPropertiesStyle.attr['fo:font-size'].replace(/pt/g, ''), 10);
            result.styles[styleName].bold = textPropertiesStyle.attr['fo:font-weight'] === 'bold';
        }

        if (paragraphPropertiesStyle) {
            const align = paragraphPropertiesStyle.attr['fo:text-align'];
            result.styles[styleName].alignment = align && align !== 'start' ? align : 'left';
        }
    });

    xml.childNamed('office:body').childNamed('office:text').childrenNamed('text:p').forEach((node) => {
        const textNodes = node.childrenNamed('text:span');
        const values = textNodes.map((n) => {
            let value = '';
            n.children.forEach((child) => {
                if (child.name === 'text:s') {
                    // We got a node that represents some amount of spaces
                    let spaces = ' ';
                    if (child.attr['text:c']) {
                        spaces = spaces.repeat(parseInt(child.attr['text:c'], 10));
                    }

                    value += spaces;
                } else if (child.name === 'text:tab') {
                    // In gdocs, space is 4 pixels, tab is 48. So, a single tab is 12 spaces
                    value += ' '.repeat(12);
                } else if (!child.name) {
                    // We got a text node
                    value += child.text;
                }
            });

            return { value, style: n.attr['text:style-name'], paragraphStyle: node.attr['text:style-name'] };
        });

        if (values && values.length > 0) {
            result.text.push(values);
        } else {
            result.text.push([{ value: ' ' }]);
        }
    });

    return result;
}

module.exports = xml2js;
