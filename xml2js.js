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
            result.styles[styleName].fontSize = parseInt(textPropertiesStyle.attr['fo:font-size'].replace(/pt/g, ''), 10);
            result.styles[styleName].bold = textPropertiesStyle.attr['fo:font-weight'] === 'bold';
        }

        if (paragraphPropertiesStyle) {
            const align = paragraphPropertiesStyle.attr['fo:text-align'];
            result.styles[styleName].alignment = align && align !== 'start' ? align : 'left';
            result.styles[styleName].marginLeft = Math.floor(parseFloat(paragraphPropertiesStyle.attr['fo:margin-left'].replace(/in/g, '')) * 72);
        }

        if (tableColumnPropertiesStyle) {
            const columnWidth = Math.floor(parseFloat(tableColumnPropertiesStyle.attr['style:column-width'].replace(/in/g, '')) * 72);
            result.styles[styleName].columnWidth = columnWidth;
        }
    });

    xml.childNamed('office:body').childNamed('office:text').children.forEach((child) => {
        if (child.name === 'text:p') {
            const values = parseTextPNode(child);

            if (values && values.length > 0) {
                result.text.push(values);
            } else {
                result.text.push([{ value: ' ' }]);
            }
        } else if (child.name === 'table:table') {
            const columnStyles = child.childrenNamed('table:table-column').map(n => n.attr['table:style-name']);
            // const columnStyles = [];
            // child.childrenNamed('table:table-column').eachChild((col) => { columnStyles.push(col.attr['table:style-name']); });

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

    return result;
}

module.exports = xml2js;
