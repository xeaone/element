import {
    vNode,
    isVoided,
    CDATA_SECTION_NODE, COMMENT_NODE, DOCUMENT_FRAGMENT_NODE, ELEMENT_NODE, TEXT_NODE, ATTRIBUTE_NODE,
} from './tool';

const stringify = (virtual: vNode): string => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        return `${virtual.data}`;
    }

    if (type === COMMENT_NODE) {
        return `<!--${virtual.data}-->`;
    }

    if (type === CDATA_SECTION_NODE) {
        return `<![CDATA[${virtual.data}]]>`;
    }

    if (type === ATTRIBUTE_NODE) {
        if (virtual.value) {
            return ` ${virtual.name}="${virtual.value}"`;
        } else {
            return ` ${virtual.name}`;
        }
    }

    if (type === ELEMENT_NODE) {
        return `<${virtual.name}${virtual.attributes.map(stringify).join('')}>` +
            (isVoided(virtual.name) ? '' :
                `${virtual.children.map(stringify).join('')}</${virtual.name}>`);
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        return `${virtual.children.map(stringify).join('')}`;
    }

    throw new Error('type not valid');
};

export default stringify;