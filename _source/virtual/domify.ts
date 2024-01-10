import {
    vNode,
    TEXT_NODE, ELEMENT_NODE, COMMENT_NODE, CDATA_SECTION_NODE, DOCUMENT_FRAGMENT_NODE, ATTRIBUTE_NODE,
} from './tool';

export const domify = (virtual: vNode, owner: Document = document): Node => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        return owner.createTextNode(virtual.data);
    }

    if (type === COMMENT_NODE) {
        return owner.createComment(virtual.data);
    }

    if (type === CDATA_SECTION_NODE) {
        return owner.createCDATASection(virtual.data);
    }

    if (type === ATTRIBUTE_NODE) {
        const attribute = owner.createAttribute(virtual.name);
        attribute.value = virtual.value;
        return attribute;
    }

    if (type === ELEMENT_NODE) {
        const element = owner.createElement(virtual.name);

        for (const attribute of virtual.attributes) {
            element.setAttribute(attribute.name, attribute.value);
        }

        for (const child of virtual.children) {
            element.appendChild(domify(child, element.ownerDocument));
        }

        return element;
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        const template = owner.createElement('template');

        for (const child of virtual.children) {
            template.appendChild(domify(child, template.ownerDocument));
        }

        return template;
    }

    throw new Error('type not valid');
};

export default domify;
