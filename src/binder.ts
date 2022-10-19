import { BindersType, BinderType, ContextType, HandlerType, RewritesType } from './types.ts';

import Compute from './compute.ts';
import Paths from './paths.ts';

import Standard from './standard.ts';
import Checked from './checked.ts';
import Inherit from './inherit.ts';
import Value from './value.ts';
import Html from './html.ts';
import Each from './each.ts';
import On from './on.ts';

const BinderSyntaxLength = 2;
const BinderSyntaxEnd = '}}';
const BinderSyntaxStart = '{{';
const BinderText = Node.TEXT_NODE;
const BinderElement = Node.ELEMENT_NODE;
const BinderAttribute = Node.ATTRIBUTE_NODE;
const BinderFragment = Node.DOCUMENT_FRAGMENT_NODE;

export const BinderCreate = async function (context: ContextType, binders: BindersType, rewrites: RewritesType, node: Node, type: number, name: string, value: string) {
    name = name ?? '';
    value = value ?? '';

    const owner = ((node as Attr).ownerElement as Element) ?? node;

    if (type === BinderAttribute) {
        ((node as Attr).ownerElement as Element).removeAttributeNode(node as Attr);
        name = name.startsWith('x-') ? name.slice(2) : name;
    }

    if (type === BinderText) {
        node.textContent = '';
        name = 'text';
    }

    if (value.startsWith(BinderSyntaxStart) && value.endsWith(BinderSyntaxEnd)) {
        value = value.slice(BinderSyntaxLength, -BinderSyntaxLength);
    }

    let handler: HandlerType;
    if (name === 'html') handler = Html;
    else if (name === 'each') handler = Each;
    else if (name === 'value') handler = Value;
    else if (name === 'text') handler = Standard;
    else if (name === 'checked') handler = Checked;
    else if (name === 'inherit') handler = Inherit;
    else if (name?.startsWith('on')) handler = On;
    else handler = Standard;

    const binder: BinderType = {
        name,
        value,
        owner,
        binders,
        context,
        rewrites,
        meta: {},
        instance: {},
        paths: Paths(value),
        compute: Compute(value),
        setup: handler.setup,
        resets: Promise.resolve(),
        renders: Promise.resolve(),
        reset() {
            return binder.resets = binder.resets.then(() => handler.reset(binder));
        },
        render() {
            return binder.renders = binder.renders.then(() => handler.render(binder));
        },
    };

    binder.setup = binder?.setup?.bind(null, binder);
    binder.compute = binder.compute.bind(binder.owner, binder.context, binder.instance);

    let path, from, to, i;
    const l = binder.paths.length;
    for (i = 0; i < l; i++) {
        path = binder.paths[i];

        for ([from, to] of rewrites) {
            if (path === from) {
                binder.paths[i] = path = to;
            } else if (path.startsWith(from + '.')) {
                binder.paths[i] = path = to + path.slice(from.length);
            }
        }

        if (binders.has(path)) {
            binders.get(path)?.add(binder);
        } else {
            binders.set(path, new Set([binder]));
        }
    }

    if (!binder.owner.x) {
        Object.defineProperty(binder.owner, 'x', { value: {} });
    }

    Object.defineProperty(binder.owner.x, name, { value: binder, enumerable: true });

    await binder.setup?.(binder);
    await binder.render();

    return binder;
};

const BinderDestroy = async function (binders: BindersType, node: Node) {
    await new Promise(function (resolve) {
        const x: Record<string, BinderType> = (node as any).x;

        if (x?.constructor === Object) {
            let name, binder, path, current;

            for (name in x) {
                binder = x[name];

                for (path of binder.paths) {
                    current = binders.get(path);
                    current?.delete(binder);
                    if (current?.size === 0) binders.delete(path);
                }
            }

            Reflect.deleteProperty(node, 'x');
        }

        resolve(undefined);
    });
};

export const BinderRemove = async function (binders: BindersType, node: Node) {
    const type = node.nodeType;
    const promises = [];

    if (type === BinderFragment) {
        let child = node.firstChild;
        while (child) {
            promises.push(BinderRemove(binders, child));
            child = child.nextSibling;
        }
    } else if (type === BinderText) {
        const x: Record<string, BinderType> = (node as any).x;
        if (x) {
            promises.push(BinderDestroy(binders, node));
        }
    } else if (type === BinderElement) {
        const x: Record<string, BinderType> = (node as any).x;

        if (x) {
            promises.push(BinderDestroy(binders, node));
        }

        let child = node.firstChild;
        while (child) {
            promises.push(BinderRemove(binders, child));
            child = child.nextSibling;
        }
    }

    await Promise.all(promises);
};

export const BinderAdd = async function (context: ContextType, binders: BindersType, rewrites: RewritesType, node: Node) {
    const type = node.nodeType;
    const promises = [];

    if (type === BinderFragment) {
        let child = node.firstChild;
        while (child) {
            promises.push(BinderAdd(context, binders, rewrites, child));
            child = child.nextSibling;
        }
    } else if (type === BinderText) {
        const start = node.nodeValue?.indexOf(BinderSyntaxStart) ?? -1;
        if (start === -1) return;
        if (start !== 0) node = (node as Text).splitText(start);

        const end = node.nodeValue?.indexOf(BinderSyntaxEnd) ?? -1;
        if (end === -1) return;

        if (end + BinderSyntaxLength !== node.nodeValue?.length) {
            promises.push(BinderAdd(context, binders, rewrites, (node as Text).splitText(end + BinderSyntaxLength)));
            promises.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''));
        } else {
            promises.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''), type);
        }
    } else if (type === BinderElement) {
        let each = false;

        const attributes = [...(node as Element).attributes];
        for (const attribute of attributes) {
            const { name, value } = attribute;
            if (value.startsWith(BinderSyntaxStart) && value.endsWith(BinderSyntaxEnd)) {
                each = name === 'each' || name === 'x-each';
                promises.push(BinderCreate(context, binders, rewrites, attribute, BinderAttribute, name, value));
            }
        }

        if (!each) {
            let child = node.firstChild;
            while (child) {
                promises.push(BinderAdd(context, binders, rewrites, child));
                child = child.nextSibling;
            }
        }
    }

    await Promise.all(promises);
};
