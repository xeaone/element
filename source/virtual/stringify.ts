import {
    isVoided,
    vCdata, vChild, vComment, vDocument, vElement, vText,
    CDATA_SECTION_NODE, COMMENT_NODE, DOCUMENT_FRAGMENT_NODE, ELEMENT_NODE, TEXT_NODE,
} from './tool';

const stringify = (virtual: vDocument | vChild) => {
    const type = virtual.type;

    if (type === TEXT_NODE) {
        const data = (virtual as vText).data;
        return `${data}`;
    }

    if (type === COMMENT_NODE) {
        const data = (virtual as vComment).data;
        return `<!--${data}-->`;
    }

    if (type === CDATA_SECTION_NODE) {
        const data = (virtual as vCdata).data;
        return `<![CDATA[${data}]]>`;
    }

    if (type === ELEMENT_NODE) {
        const name = (virtual as vElement).name;
        const children = (virtual as vElement).children;
        const attributes = (virtual as vElement).attributes;
        const element: string[] = [ `<${name}` ];

        for (const attribute of attributes) {
            if (attribute.name) {
                if (attribute.value) {
                    element.push(` ${attribute.name}="${attribute.value}"`);
                } else {
                    element.push(` ${attribute.name}`);
                }
            } else {
                console.log('at nope');
            }
        }

        if (isVoided(name)) {
            element.push('>');
        } else {
            element.push('>');

            for (const child of children) {
                element.push(stringify(child));
            }

            element.push(`</${name}>`);
        }

        return element.join('');
    }

    if (type === DOCUMENT_FRAGMENT_NODE) {
        const children = (virtual as vDocument).children;
        const template: string[] = [];

        for (const child of children) {
            template.push(stringify(child));
        }

        return template.join('');
    }

    throw new Error('invalid type');
};

export default stringify;