function xml2js(xml) {
    const result = {
        styles: {},
        text: [],
    };

    xml.childNamed('office:automatic-styles').eachChild(child => {
        result.styles[child.attr['style:name']] = {};
    });

    xml.childNamed('office:body').childNamed('office:text').childrenNamed('text:p').forEach(node => {
        const textNodes = node.childrenNamed('text:span');
        textNodes.forEach(n => { result.text.push(n.val); });
    });

    return result;
};

module.exports = xml2js;