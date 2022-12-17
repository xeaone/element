import { FragmentNode, VirtualNode } from './types.ts';
import booleans from './booleans.ts';
import display from './display.ts';

const OnCache = new WeakMap();

const attribute = function (source: Element, target: Element, name: string, value: string) {
    if (name === 'value') {
        // const result = display(property.value);
        if (source.getAttribute(name) === value) return;
        Reflect.set(source, name, value);
        source.setAttribute(name, value);
    } else if (name.startsWith('on')) {
        // if (OnCache.get(source) === value) return;
        Reflect.set(source, name, Reflect.get(target, name));
        // source.addEventListener(name, Reflect.get(target, name));
    } else if (booleans.includes(name)) {
        const result = Reflect.get(target, name) ? true : false;
        const has = source.hasAttribute(name);
        if (has === result) return;
        Reflect.set(source, name, result);
        if (result) source.setAttribute(name, '');
        else source.removeAttribute(name);
    } else {
        // const result = display(value);
        if (source.getAttribute(name) === value) return;
        Reflect.set(source, name, value);
        source.setAttribute(name, value);
    }
};

const create = function (owner: Document, target: Element): Element {
    const source = owner.createElement(target.nodeName);

    if (target.hasChildNodes()) {
        const children = target.childNodes;
        for (const child of children) {
            append(source, child);
        }
    }

    if (target.hasAttributes()) {
        const attributes = target.attributes;
        for (const { name, value } of attributes) {
            attribute(source, target, name, value);
        }
    }

    return source;
};

const append = function (parent: Node, child: Node) {
    const owner = parent.ownerDocument as Document;
    if (child instanceof Element) {
        parent.appendChild(create(owner, child));
    } else if (child instanceof Comment) {
        parent.appendChild(owner.createComment(child.nodeValue ?? ''));
    } else if (child instanceof CDATASection) {
        parent.appendChild(owner.createCDATASection(child.nodeValue ?? ''));
    } else if (child instanceof Text) {
        parent.appendChild(owner.createTextNode(child.nodeValue ?? ''));
    } else {
        throw new Error('child type not handled');
    }
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: Node) {
    if (!source.parentNode) throw new Error('source parent node not found');

    if (target.nodeName === '#text') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }

        return;
    }

    if (target.nodeName === '#comment') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }

        return;
    }

    if (!(source instanceof Element)) throw new Error('source node not valid');
    if (!(target instanceof Element)) throw new Error('target node not valid');

    if (source.nodeName !== target.nodeName) {
        const owner = source.ownerDocument;
        source.parentNode?.replaceChild(create(owner, target), source);
        return;
    }

    const targetChildren = target.childNodes;
    const targetLength = targetChildren.length;
    const sourceChildren = source.childNodes;
    // const sourceChildren = [...source.childNodes];
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

    if (target.hasAttributes()) {
        const attributes = target.attributes;
        for (const { name, value } of attributes) {
            attribute(source, target, name, value);
        }
    }
};

export default function patch(source: Element, target: DocumentFragment) {
    let index;

    const targetChildren = target.childNodes;
    const targetLength = targetChildren.length;

    const sourceChildren = source.childNodes;
    // const sourceChildren = [...source.childNodes];
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
