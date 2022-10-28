import Standard from './standard.ts';
import Checked from './checked.ts';
import Value from './value.ts';
import Html from './html.ts';
import Each from './each.ts';
import On from './on.ts';

import tool from './tool.ts';
import booleans from './boolean.ts';

// const standardRender = async function (name, value) {

//     if (binder.name == 'text') {
//         const data = await binder.compute();
//         binder.owner.textContent = tool.display(data);
//     } else if (booleans.includes(binder.name)) {
//         const data = await binder.compute() ? true : false;
//         if (data) binder.owner.setAttribute(binder.name, '');
//         else binder.owner.removeAttribute(binder.name);
//     } else {
//         let data = await binder.compute();
//         data = tool.display(data);
//         binder.owner[binder.name] = data;
//         binder.owner.setAttribute(binder.name, data ?? '');
//     }
// };

type Item = string | {
    tag: string;
    type: number;
    attributes: Record<string, any>;
    children: Array<Item | string> | string;
};

type Render = (context: Record<string, any>) => Array<Item>;

const whitespace = /^\s*$/;
const textType = Node.TEXT_NODE;
const elementType = Node.ELEMENT_NODE;
const commentType = Node.COMMENT_NODE;
const cdataType = Node.CDATA_SECTION_NODE;

const eachParametersPattern = /^\s*{{\s*\[\s*(.*?)(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?\s*\]\s*}}\s*$/;

const each = function () {
};

const escape = function (value: string) {
    return value
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/^\s*{{/, '(')
        .replace(/}}\s*$/, ')')
        .replace(/{{/g, '"+(')
        .replace(/}}/g, ')+"');
};

const handle = function (name: string, value: string): string {
    if (name === '#text') {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            return `""+${escape(value)}+""`;
        } else {
            return `"${escape(value)}"`;
        }
    } else if (booleans.includes(name)) {
        return `...((${escape(value)}) && {"${name}":""}),`;
    } else {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            if (name.startsWith('on')) {
                return `"${name}":function(event){return${escape(value)}},`;
            } else {
                return `"${name}":""+${escape(value)}+"",`;
            }
        } else {
            return `"${name}":"${escape(value)}",`;
        }
    }
};

const create = function (tag: string, type: number, attributes = {}, children: Array<Item | string> | string): Item {
    // if (tag?.constructor !== String) throw new Error('tag String required');
    // if (type?.constructor !== Number) throw new Error('type Number required');
    // if (attributes?.constructor !== Object) throw new Error('attributes Object required');
    // if (children?.constructor !== Array && children?.constructor !== String) throw new Error('children Array or String required');
    return { tag, type, attributes, children };
};

const render = function (item: Item): Node {
    if (typeof item === 'string') {
        return document.createTextNode(item);
    } else if (item.tag === '#text') {
        return document.createTextNode(item.children as string);
    } else if (item.tag === '#comment') {
        return document.createComment(item.children as string);
    } else if (item.tag === '#cdata-section') {
        return document.createCDATASection(item.children as string);
    } else {
        const { tag, attributes, children } = item;
        const element = document.createElement(tag);

        for (const name in attributes) {
            const value = attributes[name];
            if (typeof value === 'string') {
                element.setAttribute(name, value);
            } else if (typeof value === 'function' && name.startsWith('on')) {
                if (Reflect.has(element, `x${name}`)) {
                    element.addEventListener(name.slice(2), Reflect.get(element, `x${name}`));
                } else {
                    Reflect.set(element, `x${name}`, value);
                    element.addEventListener(name.slice(2), value);
                }
            } else {
                console.warn('value type might be wrong');
            }
        }

        for (const child of children) {
            element.appendChild(render(child));
        }

        return element;
    }
};

export const patch = function (source: Item, target: Item, node: Node): void {
    if (target === undefined) {
        console.warn('target undefined');
        node.parentNode?.removeChild(node);
        return;
    } else if (typeof source === 'string' || typeof target === 'string') {
        console.warn('typeof source or target equal string');
        if (source !== target) {
            node.parentNode?.replaceChild(render(target), node);
        }
    } else if (
        source.tag !== target.tag || source.type !== target.type
    ) {
        node.parentNode?.replaceChild(render(target), node);
    } else if (
        source.type === textType || target.type === textType ||
        source.type === cdataType || target.type === cdataType ||
        source.type === commentType || target.type === commentType
    ) {
        if (source.children !== target.children) {
            node.parentNode?.replaceChild(render(target), node);
        }
    } else {
        if (node.nodeType !== elementType) {
            throw new Error('wrong type');
        }

        for (const name in target.attributes) {
            const value = target.attributes[name];
            if (typeof value === 'string') {
                (node as Element).setAttribute(name, value);
            } else if (typeof value === 'function' && name.startsWith('on')) {
                if (Reflect.has(node, `x${name}`)) {
                    node.addEventListener(name.slice(2), Reflect.get(node, `x${name}`));
                } else {
                    Reflect.set(node, `x${name}`, value);
                    node.addEventListener(name.slice(2), value);
                }
            } else {
                console.warn('value type might be wrong');
            }
        }

        for (const name in source.attributes) {
            const value = target.attributes[name];
            if (typeof value !== 'string') {
                (node as Element).removeAttribute(name);
            }
        }

        const targetChildren = target.children;
        const sourceChildren = source.children;
        const sourceLength = sourceChildren.length;
        const targetLength = targetChildren.length;
        const commonLength = Math.min(sourceLength, targetLength);

        // patch common nodes
        for (let index = 0; index < commonLength; index++) {
            patch(sourceChildren[index], targetChildren[index], node.childNodes[index]);
        }

        if (sourceLength > targetLength) { // remove additional nodes
            for (let index = targetLength; index < sourceLength; index++) {
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (sourceLength < targetLength) { // append additional nodes
            // console.log(`append additional nodes: ${sourceLength}, ${targetLength}`);
            for (let index = sourceLength; index < targetLength; index++) {
                const child = target.children[index];
                node.appendChild(render(child));
            }
        }
    }
};

export const tree = function (node: Node): [string, Item] {
    const nodeType = node.nodeType;
    const nodeValue = node.nodeValue ?? '';
    const nodeName = node.nodeName.toLowerCase();

    if (nodeType === textType) {
        if (whitespace.test(nodeValue)) {
            return [
                '',
                create(nodeName, nodeType, {}, nodeValue),
            ];
        } else {
            const sChildren = handle(nodeName, nodeValue);
            return [
                `$create("${nodeName}",${nodeType},{},${sChildren})`,
                create(nodeName, nodeType, {}, nodeValue),
            ];
        }
    } else if (nodeType === elementType) {
        let sChildren = '';
        let sAttributes = '';
        const pChildren = [];
        const pAttributes: Record<string, string> = {};

        if (node.hasChildNodes()) {
            let child = node.firstChild;

            while (child) {
                const [stringified, parsed] = tree(child);
                sChildren += stringified ? `${stringified},` : '';
                pChildren.push(parsed);
                child = child.nextSibling;
            }

            sChildren = `${sChildren}`;
        }

        if ((node as Element).hasAttributes()) {
            let hasEach = false;

            const attributes = (node as Element).getAttributeNames();
            for (const name of attributes) {
                const value = (node as Element).getAttribute(name) ?? '';

                if (name === 'each') {
                    hasEach = true;
                    const [_, items, item, key, index] = value.match(eachParametersPattern) ?? [];
                    const parameters = item && key && index ? [item, key, index] : item && key ? [item, key] : item ? [item] : [];
                    sChildren = `(${items}).map((${parameters.join(',')})=>${sChildren})`;
                } else {
                    sAttributes += handle(name, value);
                }

                pAttributes[name] = value;
            }

            if (!hasEach) {
                sChildren = `[${sChildren}]`;
            }
        } else {
            sChildren = `[${sChildren}]`;
        }

        return [
            `$create("${nodeName}",${nodeType},{${sAttributes}},${sChildren})`,
            create(nodeName, nodeType, pAttributes, pChildren),
        ];
    } else if (commentType || cdataType) {
        return [
            `$create("${nodeName}",${nodeType},{},${nodeValue})`,
            create(nodeName, nodeType, {}, nodeValue),
        ];
    }

    throw new Error('Node type not handled');
};

export const compile = function (virtual: Array<string>): Render {
    const code = [
        'return function Render ($context, $cache) {',
        'with ($context) {',
        'console.log(count);',
        'return [',
        `\t${virtual.join(',\n\t')}`,
        '];',
        '}}',
    ].join('\n');

    return new Function('$cache', '$create', code)(new WeakMap(), create // {
        //     roots,
        //     standard: Standard.render,
        //     checked: Checked.render,
        //     value: Value.render,
        //     html: Html.render,
        //     each: Each.render,
        //     on: On.render,
        // }
    );
};
