function parseTextPNode(node) {
    const textNodes = node.childrenNamed('text:span');
    const values = textNodes.map((n) => {
        let value = '';
        n.children.forEach((c) => {
            if (c.name === 'text:s') {
                // We got a node that represents some amount of spaces
                let spaces = ' ';
                if (c.attr['text:c']) {
                    spaces = spaces.repeat(parseInt(c.attr['text:c'], 10));
                }

                value += spaces;
            } else if (c.name === 'text:tab') {
                // Space is 2 pixels, tab is 36 (0.5in, 1in = 72px). So, a single tab is 18 spaces
                value += ' '.repeat(18);
            } else if (!c.name) {
                // We got a text node
                value += c.text;
            }
        });

        return { value, style: n.attr['text:style-name'], paragraphStyle: node.attr['text:style-name'] };
    });

    return values;
}

function xml2js(xml) {
    const result = {
        styles: {},
        text: [],
    };

    xml.childNamed('office:automatic-styles').eachChild((child) => {
        const styleName = child.attr['style:name'];
        const textPropertiesStyle = child.childNamed('style:text-properties');
        const paragraphPropertiesStyle = child.childNamed('style:paragraph-properties');
        const tableColumnPropertiesStyle = child.childNamed('style:table-column-properties');

        result.styles[styleName] = {};

        if (textPropertiesStyle) {
            const fontSize = textPropertiesStyle.attr['fo:font-size'];
            if (fontSize) { result.styles[styleName].fontSize = Math.floor(parseInt(fontSize.replace(/pt/g, ''), 10)); }

            const fontWeight = textPropertiesStyle.attr['fo:font-weight'];
            if (fontWeight) { result.styles[styleName].bold = fontWeight === 'bold'; }
        }

        if (paragraphPropertiesStyle) {
            const align = paragraphPropertiesStyle.attr['fo:text-align'];
            result.styles[styleName].alignment = align && align !== 'start' ? align : 'left';

            const marginLeft = paragraphPropertiesStyle.attr['fo:margin-left'];
            if (marginLeft) { result.styles[styleName].marginLeft = Math.floor(parseFloat(marginLeft.replace(/in/g, '')) * 72); }
        }

        if (tableColumnPropertiesStyle) {
            const columnWidth = tableColumnPropertiesStyle.attr['style:column-width'];
            if (columnWidth) { result.styles[styleName].columnWidth = Math.floor(parseFloat(columnWidth.replace(/in/g, '')) * 72); }
        }
    });

    xml.childNamed('office:body').childNamed('office:text').children.forEach((child) => {
        if (child.name === 'text:p') {
            const values = parseTextPNode(child);

            if (values && values.length > 0) {
                const paragraph = result.styles[values[0].paragraphStyle];
                if (paragraph && paragraph.alignment && paragraph.alignment === 'center') {
                    // We have to concat all parts of the line into one string if it's supposed to be centered
                    const line = { value: '' };
                    values.forEach((value) => {
                        line.value += value.value;
                    });
                    line.style = values[0].style;
                    line.paragraphStyle = values[0].paragraphStyle;

                    result.text.push([line]);
                } else {
                    result.text.push(values);
                }
            } else {
                result.text.push([{ value: ' ' }]);
            }
        } else if (child.name === 'table:table') {
            const columnStyles = child.childrenNamed('table:table-column').map(n => n.attr['table:style-name']);

            const rows = child.childrenNamed('table:table-row');
            rows.forEach((row) => {
                const textRow = [];

                const cells = row.childrenNamed('table:table-cell');
                cells.forEach((cell, index) => {
                    const cellText = { value: '', columnStyle: columnStyles[index] };
                    cell.children.forEach((cellNode) => {
                        if (cellNode.name === 'text:p') {
                            const values = parseTextPNode(cellNode).map(v => ({ ...v, insideTable: true }));
                            values.forEach((v) => {
                                cellText.value += ` ${v.value}`;
                                cellText.style = v.style;
                                cellText.paragraphStyle = v.style;
                            });
                        }
                    });

                    textRow.push(cellText);
                });

                if (textRow && textRow.length > 0) {
                    result.text.push(textRow);
                } else {
                    result.text.push([{ value: ' ' }]);
                }
            });
        }
    });

    console.log(JSON.stringify(result));

    return result;
}

module.exports = xml2js;
