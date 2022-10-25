import Standard from './standard.ts';
import Checked from './checked.ts';
import Value from './value.ts';
import Html from './html.ts';
import Each from './each.ts';
import On from './on.ts';

const handler = function (name: string) {
    if (name === 'html') return 'html';
    else if (name === 'each') return 'each';
    // else if (name === 'value') return 'value';
    else if (name === 'text') return 'standard';
    // else if (name === 'checked') return 'checked';
    // else if (name?.startsWith('on')) return 'on';
    // else return 'standard';
};

const escape = function (name: string, value: string) {
    if (
        name.startsWith('on') ||
        name.startsWith('value') ||
        name.startsWith('each')
    ) return `"${value}"`;

    if (value) console.log(value);

    return '"' + value
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/^{{/, '"+(')
        .replace(/}}$/, ')+"')
        .replace(/{{/g, '"+(')
        .replace(/}}/g, ')+"')
        .concat('"');
};

type VNode = {
    tag: string;
    attributes: Record<string, string>;
    children: Array<VNode>;
} | string;

/**
 * @param {string} tag
 * @param {Record<string, string>} attributes
 * @param {Array<VNode>} children
 * @returns {VNode}
 */
export const vNode = function (tag = '', attributes = {}, children = []): VNode {
    if (!tag || tag?.constructor !== String) throw new Error('tag String required');
    if (attributes?.constructor !== Object) throw new Error('attributes Object required');
    if (children?.constructor !== Array) throw new Error('children Array required');
    return { tag, attributes, children };
};

export const Render = function (node: VNode) {
    if (typeof node === 'string') {
        return document.createTextNode(node);
    } else if (node.tag === '#text') {
        return document.createTextNode(node.children[0] as string);
    } else {
        const { tag, attributes, children } = node;
        const element = document.createElement(tag);

        for (const name in attributes) element.setAttribute(name, attributes[name]);
        for (const child of children) element.appendChild(Render(child));

        return element;
    }
};

export const Patch = (source: VNode, target: VNode, node: Node) => {
    if (target === undefined) {
        node.parentNode?.removeChild(node);
        return;
    } else if (
        typeof source === 'string' || typeof target === 'string'
    ) {
        if (source !== target) {
            node.parentNode?.replaceChild(Render(target), node);
        }
    } else if (
        source.tag !== target.tag
    ) {
        node.parentNode?.replaceChild(Render(target), node);
    } else if (
        node instanceof Element
    ) {
        // add new attributes
        for (const name in target.attributes) {
            const value = target.attributes[name];
            node.setAttribute(name, value);
        }

        // remove old attributes
        for (const name in source.attributes) {
            if (!(name in target.attributes)) {
                node.removeAttribute(name);
            }
        }

        const sourceLength = source.children.length;
        const targetLength = target.children.length;
        const commonLength = Math.min(sourceLength, targetLength);

        // patch common nodes
        for (let index = 0; index < commonLength; index++) {
            Patch(source.children[index], target.children[index], node.childNodes[index]);
        }

        if (
            // remove additional nodes
            sourceLength > targetLength
        ) {
            for (let index = targetLength; index < sourceLength; index++) {
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (
            // append additional nodes
            sourceLength < targetLength
        ) {
            for (let index = sourceLength; index < targetLength; index++) {
                const child = target.children[index];
                node.appendChild(Render(child));
            }
        }
    }
};

export const Virtualize = function (node: Node): string {
    const nodeType = node.nodeType;
    const nodeName = node.nodeName.toLowerCase();

    let nodeChildren = '';

    if (nodeType === Node.TEXT_NODE) {
        const value = node.nodeValue ?? '';
        nodeChildren = `[${escape('text', value)}]`;
    } else if (node.hasChildNodes?.()) {
        let child = node.firstChild;

        while (child) {
            nodeChildren += `${Virtualize(child)},`;
            child = child.nextSibling;
        }

        nodeChildren = `[${nodeChildren}]`;
    }

    let nodeAttributes = '';
    if ((node as Element).hasAttributes?.()) {
        const attributes = (node as Element).attributes;
        for (const { name, value } of attributes) {
            nodeAttributes += `"${name}":${escape(name, value)},`;
        }
    }

    return `$X.node("${nodeName}",{${nodeAttributes}},${nodeChildren})`;
};

export const Compile = function (virtual: Array<string>) {
    const code = [
        'return function Compiled ($context) {',
        'console.log($X);',
        'with ($context) {',
        'return [',
        `\t\t\t${virtual.join(',\n\t\t')}`,
        '];',
        '}}',
    ].join('\n');

    return new Function('$X', code)({
        node: vNode,
        patch: Patch,
        //     roots,
        //     length: virtual.length,

        //     standard: Standard.render,
        //     checked: Checked.render,
        //     value: Value.render,
        //     html: Html.render,
        //     each: Each.render,
        //     on: On.render,
    });
};
