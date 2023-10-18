
export const TEXT = 'TEXT';
export const CDATA = 'CDATA';
export const COMMENT = 'COMMENT';
export const CHILDREN = 'CHILDREN';

export const RESTRICTED = 'RESTRICTED';

export const TAG_OPEN_NAME = 'TAG_OPEN_NAME';
export const TAG_CLOSE_NAME = 'TAG_CLOSE_NAME';

export const ATTRIBUTE_NAME = 'ATTRIBUTE_NAME';
export const ATTRIBUTE_VALUE = 'ATTRIBUTE_VALUE';

export const ELEMENT_NODE = 1;
export const ATTRIBUTE_NODE = 2;
export const CDATA_SECTION_NODE = 4;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_TYPE_NODE = 10;
export const DOCUMENT_FRAGMENT_NODE = 11;

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#non-replaceable-character-data
const restricted = /^(style|script|noscript|textarea)$/i;
export const isRestricted = (data: string) => restricted.test(data);

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-elements
// https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const voided = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|\!doctype)$/i;
export const isVoided = (data: string) => voided.test(data);
// const voided = /^(basefont|frame|isindex)$/i;

// const HTMLEscapes = [
//     [ '&', '&amp;' ],
//     [ '<', '&lt;' ],
//     [ '>', '&gt;' ],
//     [ '"', '&quot;' ],
//     [ "'", '&#39;' ],
// ] as const;

export type vParent = vFragment | vElement;
export type vChild = vElement | vComment | vCdata | vText;
export type vNode = vFragment | vAttribute | vElement | vComment | vCdata | vText;

export type vMode =
    typeof TEXT |
    typeof CDATA |
    typeof COMMENT |
    typeof CHILDREN |
    typeof RESTRICTED |
    typeof TAG_OPEN_NAME | typeof TAG_CLOSE_NAME |
    typeof ATTRIBUTE_NAME | typeof ATTRIBUTE_VALUE;

export type vElement = {
    type: 1,
    name: '',
    parent: vParent,
    children: vChild[],
    attributes: vAttribute[],
};

export type vAttribute = {
    type: 2,
    name: string,
    value: string,
    parent: vElement,
};

export type vText = {
    type: 3,
    data: '',
    name: '#text',
    parent: vParent,
};

export type vCdata = {
    type: 4,
    data: string,
    name: '#cdata-section',
    parent: vParent;
};

export type vComment = {
    type: 8,
    data: '',
    name: '#comment',
    parent: vParent,
};

export type vFragment = {
    type: 11,
    parent: vFragment,
    children: vChild[],
    name: '#document-fragment',
};

export const createElement = (parent: vParent): vElement => {
    return { type: 1, name: '', children: [], attributes: [], parent };
};

export const createAttribute = (parent: vElement): vAttribute => {
    return { type: 2, name: '', value: '', parent };
};

export const createText = (parent: vParent): vText => {
    return { type: 3, name: '#text', data: '', parent };
};

export const createCdata = (parent: vParent): vCdata => {
    return { type: 4, name: '#cdata-section', data: '', parent };
};

export const createComment = (parent: vParent): vComment => {
    return { type: 8, name: '#comment', data: '', parent };
};

export const createFragment = (): vFragment => {
    return { type: 11, name: '#document-fragment', children: [], get parent () { return this; } };
};

export const appendElement = (parent: vParent): vElement => {
    const child = createElement(parent);
    parent.children.push(child);
    return child;
};

export const appendAttribute = (parent: vElement): vAttribute => {
    const attribute = createAttribute(parent);
    parent.attributes.push(attribute);
    return attribute;
};

export const appendText = (parent: vParent): vText => {
    const child = createText(parent);
    parent.children.push(child);
    return child;
};

export const appendCdata = (parent: vParent): vCdata => {
    const child = createCdata(parent);
    parent.children.push(child);
    return child;
};

export const appendComment = (parent: vParent): vComment => {
    const child = createComment(parent);
    parent.children.push(child);
    return child;
};
