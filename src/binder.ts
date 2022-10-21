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

const BinderSpace = /^\s*$/;
const BinderSyntaxLength = 2;
const BinderSyntaxOpen = '{{';
const BinderSyntaxClose = '}}';
const BinderSyntaxAttribute = 'x-';
const BinderText = Node.TEXT_NODE;
const BinderElement = Node.ELEMENT_NODE;
// const BinderAttribute = Node.ATTRIBUTE_NODE;
const BinderFragment = Node.DOCUMENT_FRAGMENT_NODE;

// const acceptNode = function (node: Node) {
//     if (node.nodeType === Node.TEXT_NODE && node.nodeValue && BinderSpace.test(node.nodeValue)) {
//         return NodeFilter.FILTER_REJECT;
//     } else {
//         return NodeFilter.FILTER_ACCEPT;
//     }
// };

// const Walker = function (node: Node) {
//     return document.createTreeWalker(node, 5);
//     // return document.createTreeWalker(node, 5, { acceptNode });
// };

export const BinderCreate = async function (context: ContextType, binders: BindersType, rewrites: RewritesType, node: Node, name: string, value: string) {
    if (value.startsWith(BinderSyntaxOpen) && value.endsWith(BinderSyntaxClose)) {
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
        binders,
        context,
        rewrites,
        meta: {},
        instance: {},
        owner: node,
        paths: Paths(value),
        compute: Compute(value),
        setup: handler.setup,
        resets: Promise.resolve(),
        renders: Promise.resolve(),
        reset() {
            return binder.resets = binder.resets.then(function resetPromise() {
                return handler.reset(binder);
            });
        },
        render() {
            return binder.renders = binder.renders.then(function renderPromise() {
                return handler.render(binder);
            });
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

    if (Reflect.has(binder.owner, 'x')) {
        Reflect.defineProperty(binder.owner.x, name, { value: binder, enumerable: true });
    } else {
        Reflect.defineProperty(binder.owner, 'x', { value: {} });
    }

    await binder.setup?.(binder);
    await binder.render();

    return binder;
};

export const BinderAdd = async function (context: ContextType, binders: BindersType, rewrites: RewritesType, root: Node, first?: Node, last?: Node) {
    let node: Node | null;

    const promises = [];
    const walker = document.createTreeWalker(root, 5);

    if (first) {
        node = walker.currentNode = first;
    } else if (walker.currentNode.nodeType === BinderFragment) {
        node = walker.nextNode();
    } else {
        node = walker.currentNode;
    }

    let name, value;

    while (node) {
        if (Reflect.has(node, 'x')) {
            // console.log(node, (node as any).nodeValue);
            if (first !== last && node === last) break;
            node = walker.nextSibling();
            continue;
        } else if (node.nodeType === BinderText) {
            if (!node.nodeValue || BinderSpace.test(node.nodeValue)) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }

            const open = node.nodeValue.indexOf(BinderSyntaxOpen) ?? -1;

            if (open === -1) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }

            if (open !== 0) {
                node = (node as Text).splitText(open);
                walker.currentNode = node;
            }

            const close = node.nodeValue?.indexOf(BinderSyntaxClose) ?? -1;

            if (close === -1) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }

            if (close + BinderSyntaxLength !== node.nodeValue?.length) {
                (node as Text).splitText(close + BinderSyntaxLength);
            }

            name = 'text';
            value = node.textContent ?? '';
            node.textContent = '';
            promises.push(BinderCreate(context, binders, rewrites, node, name, value));
        } else if (node.nodeType === BinderElement) {
            if ((node as Element).hasAttributes()) {
                let each = false;

                for (name of (node as Element).getAttributeNames()) {
                    value = (node as Element).getAttribute(name);

                    if (value && value.startsWith(BinderSyntaxOpen) && value.endsWith(BinderSyntaxClose)) {
                        (node as Element).removeAttribute(name);

                        name = name.startsWith(BinderSyntaxAttribute) ? name.slice(2) : name;
                        if (!each) each = name === 'each';

                        promises.push(BinderCreate(context, binders, rewrites, node, name, value));
                    }
                }

                if (each) {
                    if (first !== last && node === last) break;
                    node = walker.nextSibling();
                    continue;
                }
            }
        }

        if (first !== last && node === last) {
            break;
        }

        node = walker.nextNode();
    }

    await Promise.all(promises);
};

const BinderDestroy = async function (binders: BindersType, node: Node) {
    await new Promise(function (resolve) {
        const x = Reflect.get(node, 'x');

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

export const BinderRemove = async function (binders: BindersType, root: Node) {
    let node: Node | null;

    const promises = [];
    const walker = document.createTreeWalker(root, 5);

    if (walker.currentNode.nodeType === BinderFragment) {
        node = walker.nextNode();
    } else {
        node = walker.currentNode;
    }

    while (node) {
        if (node.nodeType === BinderText) {
            if (Reflect.has(node, 'x')) {
                promises.push(BinderDestroy(binders, node));
            }
        } else if (node.nodeType === BinderElement) {
            if (Reflect.has(node, 'x')) {
                promises.push(BinderDestroy(binders, node));
            }
        }

        node = walker.nextNode();
    }

    await Promise.all(promises);
};

// export const BinderRemove = async function (binders: BindersType, node: Node) {
//     const type = node.nodeType;
//     const promises = [];

//     if (type === BinderFragment) {
//         let child = node.firstChild;
//         while (child) {
//             promises.push(BinderRemove(binders, child));
//             child = child.nextSibling;
//         }
//     } else if (type === BinderText) {
//         const x: Record<string, BinderType> = (node as any).x;
//         if (x) {
//             promises.push(BinderDestroy(binders, node));
//         }
//     } else if (type === BinderElement) {
//         const x: Record<string, BinderType> = (node as any).x;

//         if (x) {
//             promises.push(BinderDestroy(binders, node));
//         }

//         let child = node.firstChild;
//         while (child) {
//             promises.push(BinderRemove(binders, child));
//             child = child.nextSibling;
//         }
//     }

//     await Promise.all(promises);
// };

// export const BinderAdd = async function (context: ContextType, binders: BindersType, rewrites: RewritesType, node: Node) {
//     const type = node.nodeType;
//     const promises = [];

//     if (type === BinderFragment) {
//         let child = node.firstChild;
//         while (child) {
//             promises.push(BinderAdd(context, binders, rewrites, child));
//             child = child.nextSibling;
//         }
//     } else if (type === BinderText) {
//         const start = node.nodeValue?.indexOf(BinderSyntaxOpen) ?? -1;
//         if (start === -1) return;
//         if (start !== 0) node = (node as Text).splitText(start);

//         const end = node.nodeValue?.indexOf(BinderSyntaxClose) ?? -1;
//         if (end === -1) return;

//         if (end + BinderSyntaxLength !== node.nodeValue?.length) {
//             promises.push(BinderAdd(context, binders, rewrites, (node as Text).splitText(end + BinderSyntaxLength)));
//             promises.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''));
//         } else {
//             promises.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''), type);
//         }
//     } else if (type === BinderElement) {
//         let each = false;

//         const attributes = [...(node as Element).attributes];
//         for (const attribute of attributes) {
//             const { name, value } = attribute;
//             if (value.startsWith(BinderSyntaxOpen) && value.endsWith(BinderSyntaxClose)) {
//                 each = name === 'each' || name === 'x-each';
//                 promises.push(BinderCreate(context, binders, rewrites, attribute, BinderAttribute, name, value));
//             }
//         }

//         if (!each) {
//             let child = node.firstChild;
//             while (child) {
//                 promises.push(BinderAdd(context, binders, rewrites, child));
//                 child = child.nextSibling;
//             }
//         }
//     }

//     await Promise.all(promises);
// };
