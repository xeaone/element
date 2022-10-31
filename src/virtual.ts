import { ContextType } from './types.ts';

import { cdataType, commentType, elementType, textType, whitespace } from './tool.ts';
import booleans from './boolean.ts';
import date from './date.ts';

type Render = (context: ContextType) => Array<Item>;
type ComputeElement = (element: Element) => void;
type Attributes = Record<string, string | ComputeElement>;

type Item = string | {
    tag: string;
    type: number;
    attributes: Attributes;
    children: Array<Item | string> | string;
};

const escape = function (value: string) {
    return '(' + value
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        // .replace(/^\s*{{/, '(')
        // .replace(/}}\s*$/, ')')
        .replace(/^\s*{{/, '')
        .replace(/}}\s*$/, '')
        .replace(/{{/g, '"+(')
        .replace(/}}/g, ')+"') +
        ')';
};

const compute = function (name: string, value: any) {
    if (name === 'value') {
        return function (element: Element) {
            const type = Reflect.get(element, 'type');

            if (typeof value === 'number' && date.includes(type)) {
                const iso = new Date(value).toLocaleString('default', {
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 3,
                }).replace(/(\d+)\/(\d+)\/(\d+), ([0-9:.]+)/, '$3-$1-$2T$4Z');

                if (type === 'date') value = iso.slice(0, 10);
                else if (type === 'time') value = iso.slice(11, -1);
                else if (type === 'month') value = iso.slice(0, 7);
                else if (type === 'datetime-local') value = iso.slice(0, -1);
            }

            value = `${value == undefined ? '' : value}`;
            Reflect.set(element, name, value);
            element.setAttribute(name, value);
        };
    } else if (name.startsWith('on')) {
        return function (element: Element) {
            if (Reflect.has(element, `x${name}`)) {
                element.addEventListener(name.slice(2), Reflect.get(element, `x${name}`));
            } else {
                Reflect.set(element, `x${name}`, value);
                element.addEventListener(name.slice(2), value);
            }
            if (element.hasAttribute(name)) element.removeAttribute(name);
        };
    } else if (booleans.includes(name)) {
        return function (element: Element) {
            const result = value ? true : false;
            Reflect.set(element, name, result);
            if (result) element.setAttribute(name, '');
            else element.removeAttribute(name);
        };
    } else {
        return value;
    }
};

const eachParametersPattern = /^\s*{{\s*\[\s*(.*?)(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?\s*\]\s*}}\s*$/;
const eachCompile = function (children: string, value: string): string {
    const [_, items, item, key, index] = value.match(eachParametersPattern) ?? [];
    const parameters = item && key && index ? [item, key, index] : item && key ? [item, key] : item ? [item] : [];
    return `(${items}).map((${parameters.join(',')})=>${children}).flat()`;
};

const textCompile = function (value: string): string {
    if (value.startsWith('{{') && value.endsWith('}}')) {
        return `""+${escape(value)}+""`;
    } else {
        return `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
};

const attributeCompile = function (name: string, value: string): string {
    if (name.startsWith('x-') || (value.startsWith('{{') && value.endsWith('}}'))) {
        name = name.startsWith('x-') ? name.slice(2) : name;
        if (name.startsWith('on')) {
            return `"${name}":$compute("${name}",function(event){return${escape(value)}}),`;
        } else {
            return `"${name}":$compute("${name}",${escape(value)}),`;
        }
    } else {
        return `"${name}":"${value}",`;
    }
};

const attributesRender = function (element: Element, attributes: Attributes) {
    for (const name in attributes) {
        const value = attributes[name];
        if (typeof value === 'function') {
            value(element);
        } else {
            element.setAttribute(name, value);
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

        for (const child of children) {
            element.appendChild(render(child));
        }

        attributesRender(element, attributes);

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

        const targetChildren = target.children;
        const sourceChildren = source.children;
        const sourceLength = sourceChildren.length;
        const targetLength = targetChildren.length;
        const commonLength = Math.min(sourceLength, targetLength);

        for (let index = 0; index < commonLength; index++) { // patch common nodes
            patch(sourceChildren[index], targetChildren[index], node.childNodes[index]);
        }

        if (sourceLength > targetLength) { // remove additional nodes
            for (let index = targetLength; index < sourceLength; index++) {
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (sourceLength < targetLength) { // append additional nodes
            for (let index = sourceLength; index < targetLength; index++) {
                const child = target.children[index];
                node.appendChild(render(child));
            }
        }

        attributesRender(node as Element, target.attributes);

        for (const name in source.attributes) {
            // const value = target.attributes[name];
            // if (name.startsWith('on') && typeof value !== 'string') {
            //     (node as Element).removeAttribute(name);
            // } else
            if (!(name in target.attributes)) {
                (node as Element).removeAttribute(name);
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
            const sChildren = textCompile(nodeValue);
            return [
                `$create("${nodeName}",${nodeType},{},${sChildren})`,
                create(nodeName, nodeType, {}, nodeValue),
            ];
        }
    }

    if (nodeType === elementType) {
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

            sChildren = `[${sChildren}]`;
        }

        if ((node as Element).hasAttributes()) {
            const attributes = (node as Element).getAttributeNames();
            for (const name of attributes) {
                const value = (node as Element).getAttribute(name) ?? '';

                if (['each', 'x-each'].includes(name)) {
                    sChildren = eachCompile(sChildren, value);
                } else {
                    sAttributes += attributeCompile(name, value);
                }

                pAttributes[name] = value;
            }
        }

        return [
            `$create("${nodeName}",${nodeType},{${sAttributes}},${sChildren || '[]'})`,
            create(nodeName, nodeType, pAttributes, pChildren),
        ];
    }

    if (commentType || cdataType) {
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
        'console.log("here");',
        'return [',
        `\t${virtual.join(',\n\t')}`,
        '];',
        '}}',
    ].join('\n');

    return new Function('$cache', '$create', '$compute', code)(new WeakMap(), create, compute // {
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
