import { FragmentNode, VirtualNode } from './types.ts';
import booleans from './booleans.ts';
import display from './display.ts';

const OnCache = new WeakMap();

const replace = function (node: VirtualNode, properties: any) {
    for (const key in properties) {
        node.name = node.name.replace(key, properties[key]);
        node.value = node.value.replace(key, properties[key]);
    }
};

const attribute = function (element: Element, name: string, value: any) {
    if (name === 'value') {
        const result = display(value);
        if (element.getAttribute(name) === result) return;
        Reflect.set(element, name, result);
        element.setAttribute(name, result);
    } else if (name.startsWith('on')) {
        if (OnCache.get(element) === value) return;
        Reflect.set(element, name, value);
        element.addEventListener(name, value);
    } else if (booleans.includes(name)) {
        const result = value ? true : false;
        const has = element.hasAttribute(name);
        if (has === result) return;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else {
        const result = display(value);
        if (element.getAttribute(name) === result) return;
        Reflect.set(element, name, result);
        element.setAttribute(name, result);
    }
};

const create = function (owner: Document, node: VirtualNode): Element {
    const element = owner.createElement(node.name);

    const children = node.children;
    for (const child of children) {
        append(element, child);
    }

    const attributes = node.attributes;
    for (const { name, value } of attributes) {
        attribute(element, name, value);
    }

    return element;
};

const append = function (parent: Node, child: VirtualNode) {
    const owner = parent.ownerDocument as Document;
    if (child.type === Node.ELEMENT_NODE) {
        parent.appendChild(create(owner, child));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else if (child.type === Node.TEXT_NODE) {
        parent.appendChild(owner.createTextNode(child.value));
    } else {
        console.error(child);
        throw new Error('child type not handled');
    }
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: VirtualNode) {
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

    if (!(source instanceof Element)) throw new Error('source node not valid');
    // if (!(target instanceof Element)) throw new Error('target node not valid');

    if (source.nodeName !== target.name) {
        const owner = source.ownerDocument as Document;
        source.parentNode?.replaceChild(create(owner, target), source);
        return;
    }

    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index]);
        }
    }

    const attributes = target.attributes;
    for (const { name, value } of attributes) {
        attribute(source, name, value);
    }
};

export default function patch(source: Element, target: FragmentNode) {
    let index;

    const targetChildren = target.children;
    const targetLength = targetChildren.length;

    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index]);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index]);
        }
    }
}
