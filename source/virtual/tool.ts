
export const TEXT = 'TEXT';
export const CDATA = 'CDATA';
export const COMMENT = 'COMMENT';
export const CHILDREN = 'CHILDREN';

export const RESTRICTED = 'RESTRICTED';

export const TAG_OPEN_NAME = 'TAG_OPEN_NAME';
export const TAG_CLOSE_NAME = 'TAG_CLOSE_NAME';

export const ATTRIBUTE_NAME = 'ATTRIBUTE_NAME';
export const ATTRIBUTE_VALUE = 'ATTRIBUTE_VALUE';

export const TEXT_NODE = 3;
export const ELEMENT_NODE = 1;
export const COMMENT_NODE = 8;
export const CDATA_SECTION_NODE = 4;
export const DOCUMENT_FRAGMENT_NODE = 11;

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#non-replaceable-character-data
const restricted = /^(style|script|textarea)$/i;
export const isRestricted = (data: string) => restricted.test(data);

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-elements
const voided = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
export const isVoided = (data: string) => voided.test(data);
// const voided = /^(basefont|frame|isindex)$/i;

// const HTMLEscapes = [
//     [ '&', '&amp;' ],
//     [ '<', '&lt;' ],
//     [ '>', '&gt;' ],
//     [ '"', '&quot;' ],
//     [ "'", '&#39;' ],
// ] as const;

export type vParent = vDocument | vElement;
export type vChild = vElement | vComment | vCdata | vText;
export type vNode = vDocument | vAttribute | vElement | vComment | vCdata | vText;

export type vMode =
    typeof TEXT |
    typeof CDATA |
    typeof COMMENT |
    typeof CHILDREN |
    typeof RESTRICTED |
    typeof TAG_OPEN_NAME | typeof TAG_CLOSE_NAME |
    typeof ATTRIBUTE_NAME | typeof ATTRIBUTE_VALUE;

export type vAttribute = {
    name: string,
    value: string,
    parent: vElement,
};

export class vCdata {
    type = 4;
    data = '';
    name = '#cdata-section';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vComment {
    type = 8;
    data = '';
    name = '#comment';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vText {
    type = 3;
    data = '';
    name = '#text';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vRestricted {
    type = 1;
    name = '';
    data = '';
    parent: vParent;
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vElement {
    type = 1;
    name = '';
    parent: vParent;
    children: vChild[] = [];
    attributes: vAttribute[] = [];
    constructor (parent: vParent) {
        this.parent = parent;
    }
}

export class vDocument {
    type = 11;
    parent = this;
    name = '#document-fragment';
    children: vChild[] = [];
}

export const appendElement = (parent: vParent) => {
    const child = new vElement(parent);
    parent.children.push(child);
    return child;
};

export const appendComment = (parent: vParent) => {
    const child = new vComment(parent);
    parent.children.push(child);
    return child;
};

export const appendCdata = (parent: vParent) => {
    const child = new vCdata(parent);
    parent.children.push(child);
    return child;
};

export const appendText = (parent: vParent) => {
    const child = new vText(parent);
    parent.children.push(child);
    return child;
};

export const appendAttribute = (element: vElement) => {
    const attribute: vAttribute = { parent: element, name: '', value: '' };
    element.attributes.push(attribute);
    return attribute as vAttribute;
};