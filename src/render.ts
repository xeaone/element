// import patch from './patch.ts';
import patch from './patch-dom.ts';
import html from './html.ts';
import parse from './parse.ts';
import booleans from './booleans.ts';
import { VirtualNode } from './types.ts';

(window as any).x = {};

const RenderCache = new WeakMap();

const RenderActions = function (strings:string[], values:any[]) {
    const cache = RenderCache.get(strings);
    const l = values.length;
    for (let i = 0; i < l; i++) {
        const newValue = values[i];
        const oldValue = cache.values[i];
        if (newValue?.constructor === Array) continue;
        if (newValue?.constructor === Object) continue;
        if (newValue !== oldValue) {
            cache.actions[i](newValue, oldValue);
            cache.values[i] = values[i];
        }
    }
};

const RenderHandle = function (node:Node, cache: any, values:any[]) {
        if (node.nodeType === Node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf('{{') ?? -1;
            if (start == -1) return;
            if (start != 0) {
                (node as Text).splitText(start);
                return;
                // node = walker.nextNode() as Node;
            }

            const end = node.nodeValue?.indexOf('}}') ?? -1;
            if (end == -1) return;

            if (end + 2 != node.nodeValue?.length) {
                (node as Text).splitText(end + 2);
            }

            const newValue = values[cache.actions.length];
            const oldValue = node.nodeValue;

            if (newValue?.constructor === Array) {
                const start = document.createTextNode('start');
                const end = node;
                end.nodeValue = 'end';
                end.parentNode?.insertBefore(start, end);
                const action = function (start: Text, end:Text, newValue: any, oldValue: any) {
                    // TODO: need to handle
                    for (const {strings, values} of newValue) {
                        const cacheChild = RenderWalk(strings, values);
                        for (const cacheNode of cacheChild.nodes) {
                            end.parentNode?.insertBefore(cacheNode, end) as Element;
                        }
                    }
                }.bind(null, start as Text, end as Text);

                action(newValue, oldValue);

                cache.actions.push(action);
            } else {
                const action = function (node: Text, newValue: any, oldValue: any) {
                    node.nodeValue = newValue;
                }.bind(null, node as Text);

                action(newValue, oldValue);

                cache.actions.push(action);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const attributes = [...(node as Element).attributes];
            for (const attribute of attributes) {
                if (attribute.value.includes('{{') && attribute.value.includes('}}')) {
                    if (attribute.name.startsWith('on')) {
                        const action = function (node: Element, attribute: Attr, newValue: any, oldValue: any) {
                            node.addEventListener(attribute.name.slice(2), newValue);
                        }.bind(null, node as Element, attribute);
                        (node as Element).removeAttributeNode(attribute);
                        action(values[cache.actions.length], attribute.value);
                        cache.actions.push(action);
                    } else {
                        const action = function (node: Element, attribute: Attr, newValue: any, oldValue: any) {
                            node.setAttribute(attribute.name, newValue);
                        }.bind(null, node as Element, attribute);
                        action(values[cache.actions.length], attribute.value);
                        cache.actions.push(action);
                    }
                }
            }
        }
};

// const RenderUpgrade = function (cache:any, values:any[]) {
//     const walker = document.createTreeWalker(document, 5, null);
//     walker.currentNode = cache.fragment;

//     let node: Node | null = cache.fragment.firstChild;

//     while ((node = walker.nextNode()) !== null) {
//         RenderHandle(node, cache, values);
//     }
// };

const RenderWalk = function (strings: string[] , values: any[]) {
    let cache = RenderCache.get(strings);

    if (cache) {
        RenderActions(strings, values);
        return cache;
    }

    cache = {
        values,
        // nodes: [],
        actions: [],
        rooted: false,
        template: document.createElement('template')
    };
    RenderCache.set(strings, cache);

    let data = '';
    const length = strings.length - 1;
    for (let index = 0; index < length; index++) {
        data += `${strings[index]}{{${index}}}`;
    }

    data += strings[strings.length - 1];

    cache.template.innerHTML = data;
    cache.fragment = cache.template.cloneNode(true).content;

    // cache.nodes = [...cache.fragment.childNodes];

    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = cache.fragment;

    let node: Node | null = cache.fragment.firstChild;

    while ((node = walker.nextNode()) !== null) {
        RenderHandle(node, cache, values);
    }

    return cache;
};

export default async function render(root: Element, context: any, component: any) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values } = component(html, context);

    const cache = RenderWalk(strings, values);
    console.log(cache);

    if (!cache.rooted) {
        cache.rooted = true;
        root.replaceChildren(cache.fragment);
    }

    // if (RenderCache.has(strings)) {
    //     RenderActions(strings, values);
    //     return;
    // }

    // const cache:any = { values, actions: [] };
    // RenderCache.set(strings, cache);

    // let data = '';
    // const length = strings.length - 1;
    // for (let index = 0; index < length; index++) {
    //     data += `${strings[index]}{{${index}}}`;
    // }

    // data += strings[strings.length - 1];

    // // parse(root, values, data);

    // const template = document.createElement('template');
    // template.innerHTML = data;
    // const clone = template.content.cloneNode(true) as DocumentFragment;

    // const walker = document.createTreeWalker(document, 5, null);
    // walker.currentNode = template.content;

    // let node: Node | null = template.content.firstChild;

    // while ((node = walker.nextNode()) !== null) {
    //     if (node.nodeType === Node.TEXT_NODE) {
    //         const start = node.nodeValue?.indexOf('{{') ?? -1;
    //         if (start == -1) continue;
    //         if (start != 0) {
    //             (node as Text).splitText(start);
    //             node = walker.nextNode() as Node;
    //         }

    //         const end = node.nodeValue?.indexOf('}}') ?? -1;
    //         if (end == -1) continue;

    //         if (end + 2 != node.nodeValue?.length) {
    //             (node as Text).splitText(end + 2);
    //         }

    //         const newValue = values[cache.actions.length];
    //         const oldValue = node.nodeValue;

    //         if (newValue?.constructor === Array) {
    //             // const markerOpen = document.createComment(cache.actions.length);
    //             // const markerClose = document.createComment(cache.actions.length);
    //             // node.parentNode?.insertBefore(markerOpen, node);
    //             // node.parentNode?.replaceChild(markerClose, node);
    //             // const action = function (markerOpen: Comment, markerClose:Comment, newValue: any, oldValue: any) {
    //             // }.bind(null, markerOpen, markerClose);
    //             const start = document.createTextNode('');
    //             const end = node;
    //             end.nodeValue = '';
    //             end.parentNode?.insertBefore(start, end);
    //             const action = function (start: Text, end:Text, newValue: any, oldValue: any) {
    //                 // let current:any = end;
    //                 for (const item of newValue) {
    //                     // const newChild = document.createElement('div');
    //                     // newChild.textContent = 'test';
    //                     // current = current.parentNode?.insertBefore(newChild, current) as Element;
    //                 }
    //             }.bind(null, start as Text, end as Text);

    //             action(newValue, oldValue);

    //             cache.actions.push(action);
    //         } else {
    //             const action = function (node: Text, newValue: any, oldValue: any) {
    //                 node.nodeValue = newValue;
    //             }.bind(null, node as Text);

    //             action(newValue, oldValue);

    //             cache.actions.push(action);
    //         }
    //     } else if (node.nodeType === Node.ELEMENT_NODE) {
    //         const attributes = [...(node as Element).attributes];
    //         for (const attribute of attributes) {
    //             if (attribute.value.includes('{{') && attribute.value.includes('}}')) {
    //                 if (attribute.name.startsWith('on')) {
    //                     const action = function (node: Element, attribute: Attr, newValue: any, oldValue: any) {
    //                         node.addEventListener(attribute.name.slice(2), newValue);
    //                     }.bind(null, node as Element, attribute);
    //                     (node as Element).removeAttributeNode(attribute);
    //                     action(values[cache.actions.length], attribute.value);
    //                     cache.actions.push(action);
    //                 } else {
    //                     const action = function (node: Element, attribute: Attr, newValue: any, oldValue: any) {
    //                         node.setAttribute(attribute.name, newValue);
    //                     }.bind(null, node as Element, attribute);
    //                     action(values[cache.actions.length], attribute.value);
    //                     cache.actions.push(action);
    //                 }
    //             }
    //         }
    //     }
    // }
    // console.log(cache);
    // root.replaceChildren(template.content);

    // const query = `//*[contains(text(), '{{')]`;
    // const query = `//comment()[contains(., '{{') and contains(., '}}')]`;
    // const query = `//*[@*[contains(., '{{') and contains(., '}}')]]`;
    // const query = `//*[contains(text(), '{{') and contains(text(), '}}')]`;
    // const result = document.evaluate(query, (template.content as any).firstChild, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    // let node = null;
    // let records = [];
    // while (node = result.iterateNext()) {
    //     console.log(node);
    //     records.push(node);
    // }

    // patch(root, template.content);

    // const cloned = clone(parsed, result.values);
    // patch(root, cloned);
    // patch(root, parsed);

    // patch(root, template);
    // patch(root, template.content, bindings);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
