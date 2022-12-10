import { BooleanAttributes } from './tool.ts';
import display from './display.ts';

const OnCache = new WeakMap();

const attributes = function (source: Element, target: Element, bindings: any) {
    const targetAttributeNames = target.hasAttributes() ? [...target.getAttributeNames()] : [];
    const sourceAttributeNames = source.hasAttributes() ? [...source.getAttributeNames()] : [];

    for (const name of targetAttributeNames) {
        if (name === 'data-x-value') {
            const { value } = bindings[target.getAttribute(name) as string];
            const result = `${value == undefined ? '' : value}`;
            if (source.getAttribute('value') === result) continue;
            Reflect.set(source, 'value', result);
            source.setAttribute('value', result);
        } else if (name.startsWith('data-x-on')) {
            const { value } = bindings[target.getAttribute(name) as string];
            if (OnCache.get(source) === value) continue;
            source.addEventListener(name.slice(9), value);
        } else if (BooleanAttributes.includes(name.slice(7))) {
            const { value } = bindings[target.getAttribute(name) as string];
            const slice = name.slice(7);
            const result = value ? true : false;
            const has = source.hasAttribute(slice);
            if (has === result) continue;
            Reflect.set(source, name, result);
            if (result) source.setAttribute(slice, '');
            else source.removeAttribute(slice);
        } else if (name.startsWith('data-x')) {
            const { value } = bindings[target.getAttribute(name) as string];
            const slice = name.slice(7);
            const result = display(value);
            console.log(result, value, source);
            if (source.getAttribute(slice) === result) continue;
            source.setAttribute(slice, result);
        } else {
            const sourceAttributeValue = source.getAttribute(name);
            const targetAttributeValue = target.getAttribute(name);
            if (sourceAttributeValue !== targetAttributeValue) {
                source.setAttribute(name, targetAttributeValue as string);
                Reflect.set(source, name, targetAttributeValue);
            }
        }
    }

    for (const name of sourceAttributeNames) {
        if (targetAttributeNames.includes(`data-x-${name}`)) continue;
        if (!targetAttributeNames.includes(name)) source.removeAttribute(name);
    }
};

const children = function (node: Node, bindings: any) {
    if (node instanceof Element) {
        const nodeAttributeNames = node.hasAttributes() ? [...node.getAttributeNames()] : [];

        for (const name of nodeAttributeNames) {
            if (name === 'data-x-value') {
                const { value } = bindings[node.getAttribute(name) as string];
                const result = `${value == undefined ? '' : value}`;
                Reflect.set(node, 'value', result);
                node.setAttribute('value', result);
                node.removeAttribute(name);
            } else if (name.startsWith('data-x-on')) {
                const { value } = bindings[node.getAttribute(name) as string];
                OnCache.set(node, value);
                node.addEventListener(name.slice(9), value);
                node.removeAttribute(name);
            } else if (BooleanAttributes.includes(name.slice(7))) {
                const { value } = bindings[node.getAttribute(name) as string];
                const slice = name.slice(7);
                const result = value ? true : false;
                Reflect.set(node, name, result);
                if (result) node.setAttribute(slice, '');
                else node.removeAttribute(slice);
                node.removeAttribute(name);
            } else if (name.startsWith('data-x')) {
                const { value } = bindings[node.getAttribute(name) as string];
                const slice = name.slice(7);
                const result = display(value);
                node.setAttribute(slice, result);
                node.removeAttribute(name);
            }
        }
    }

    let child = node.firstChild;
    while (child) {
        children(child, bindings);
        child = child.nextSibling;
    }
};

const append = function (parent: Node, child: Node, bindings: any) {
    children(child, bindings);
    parent.appendChild(child);
};

const remove = function (parent: Node) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};

const common = function (source: Node, target: Node, bindings: any) {
    if (!source.parentNode) throw new Error('source parent node not found');

    if (source.nodeName !== target.nodeName) {
        source.parentNode?.replaceChild(target, source);
        return;
    }

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

    const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;
    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);

    let index;

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], bindings);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], bindings);
        }
    }

    attributes(source, target, bindings);
};

export default function patch(source: Element, target: DocumentFragment, bindings: any) {
    let index;

    const targetChildren = [...target.childNodes];
    const targetLength = targetChildren.length;

    const sourceChildren = [...source.childNodes];
    const sourceLength = sourceChildren.length;

    const commonLength = Math.min(sourceLength, targetLength);

    for (index = 0; index < commonLength; index++) {
        common(sourceChildren[index], targetChildren[index], bindings);
    }

    if (sourceLength > targetLength) {
        for (index = targetLength; index < sourceLength; index++) {
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for (index = sourceLength; index < targetLength; index++) {
            append(source, targetChildren[index], bindings);
        }
    }
}
