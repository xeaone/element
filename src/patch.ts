import { FragmentNode, VirtualNode } from './types.ts';
import booleans from './booleans.ts';
import display from './display.ts';

// const attributes = function (source: Element, target: VirtualNode, properties: any) {
//     const attributes = target.attributes;

//     for (const { name, value } of attributes) {
//         attribute(source, name, value, properties);
//     }

//     // if (source.hasAttributes()) {
//     //     const names = source.getAttributeNames();
//     //     for (const name of names) {
//     //         if (!(name in attributes)) {
//     //             source.removeAttribute(name);
//     //         }
//     //     }
//     // }
// };

const OnCache = new WeakMap();

const attribute = function (element: Element, name: string, value: string, properties: any) {
    if (value.startsWith('{{') && value.endsWith('}}')) {
        const property = properties[value.slice(2, -2)];

        if (property.name === 'value') {
            const result = display(property.value);
            if (element.getAttribute(property.name) === result) return;
            Reflect.set(element, property.name, result);
            element.setAttribute(property.name, result);
        } else if (property.name.startsWith('on')) {
            if (OnCache.get(element) === property.value) return;
            Reflect.set(element, property.name, property.value);
            element.addEventListener(property.name, property.value);
        } else if (booleans.includes(property.name)) {
            const result = property.value ? true : false;
            const has = element.hasAttribute(property.name);
            if (has === result) return;
            Reflect.set(element, property.name, result);
            if (result) element.setAttribute(property.name, '');
            else element.removeAttribute(property.name);
        } else {
            const result = display(property.value);
            if (element.getAttribute(property.name) === result) return;
            Reflect.set(element, property.name, result);
            element.setAttribute(property.name, result);
        }
    } else {
        if (element.getAttribute(name) === value) return;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    }
};

const create = function (owner: Document, node: VirtualNode, properties: any): Element {
    const element = owner.createElement(node.name);

    const children = node.children;
    for (const child of children) {
        append(element, child, properties);
    }

    const attributes = node.attributes;
    for (const { name, value } of attributes) {
        attribute(element, name, value, properties);
    }

    return element;
};

const append = function (parent: Node, child: VirtualNode, properties: any) {
    const owner = parent.ownerDocument as Document;
    if (child.type === Node.ELEMENT_NODE) {
        parent.appendChild(create(owner, child, properties));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(display(child.value)));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(display(child.value)));
    } else if (child.type === Node.TEXT_NODE) {
        parent.appendChild(owner.createTextNode(display(child.value)));
    } else {
        throw new Error('child type not handled');
    }
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: VirtualNode, properties: any) {
    if (!source.parentNode) throw new Error('source parent node not found');

    if (target.name === '#text') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }

        return;
    }

    if (target.name === '#comment') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }

        return;
    }

    if (source.nodeName.toLowerCase() !== target.name) {
        const owner = source.ownerDocument as Document;
        source.parentNode?.replaceChild(create(owner, target, properties), source);
        return;
    }

    if (!(source instanceof Element)) throw new Error('source node not valid');
    // if (!(target instanceof Element)) throw new Error('target node not valid');

    const targetChildren = target.children;
    // const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;
    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], properties);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], properties);
        }
    }

    const attributes = target.attributes;
    for (const { name, value } of attributes) {
        attribute(source, name, value, properties);
    }
};

export default function patch(source: Element, target: FragmentNode, properties: any) {
    let index;

    const targetChildren = target.children;
    // const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], properties);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], properties);
        }
    }
}
