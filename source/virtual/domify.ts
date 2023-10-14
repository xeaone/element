import { vDocument, vChild, TEXT_NODE, vText, COMMENT_NODE, vComment, CDATA_SECTION_NODE, vCdata, ELEMENT_NODE, vElement, DOCUMENT_FRAGMENT_NODE } from './tool';

export const domify = (virtual: vDocument | vChild, owner: Document = document) => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        const data = (virtual as vText).data;
        return owner.createTextNode(data);
    }

    if (type === COMMENT_NODE) {
        const data = (virtual as vComment).data;
        return owner.createComment(data);
    }

    if (type === CDATA_SECTION_NODE) {
        const data = (virtual as vCdata).data;
        return owner.createCDATASection(data);
    }

    if (type === ELEMENT_NODE) {
        if (!parent) throw new Error('expected parent');
        const name = (virtual as vElement).name;
        const children = (virtual as vElement).children;
        const element = owner.createElement(name);

        for (const child of children) {
            element.appendChild(domify(child, element.ownerDocument));
        }

        return element;
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        const children = (virtual as vDocument).children;
        const template = owner.createElement('template');

        for (const child of children) {
            template.appendChild(domify(child, template.ownerDocument));
        }

        return template;
    }

    throw new Error('invalid type');
};

export default domify;
