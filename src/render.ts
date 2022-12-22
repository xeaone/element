// import patch from './patch.ts';
import patch from './patch-dom.ts';
import html from './html.ts';
import parse from './parse.ts';
import booleans from './booleans.ts';
import { VirtualNode } from './types.ts';

(window as any).x = {};

const RenderCache = new WeakMap();
const RenderTemplates = new WeakMap();

const RenderRun = function (strings: string[], values: any[]) {
    const cache = RenderCache.get(strings);
    const l = values.length;
    for (let i = 0; i < l; i++) {
        const newValue = values[i];
        const oldValue = cache.values[i];
        // if (newValue?.constructor === Array) continue;
        if (newValue?.constructor === Object) continue;
        if (newValue !== oldValue) {
            cache.actions[i](newValue, oldValue);
            cache.values[i] = values[i];
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

const RenderWalk = function (fragment: DocumentFragment, values: any[], actions: any[]) {
    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = fragment;

    let node: Node | null = fragment.firstChild;

    while ((node = walker.nextNode()) !== null) {
        if (node.nodeType === Node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf('{{') ?? -1;
            if (start == -1) continue;
            if (start != 0) {
                (node as Text).splitText(start);
                node = walker.nextNode() as Node;
            }

            const end = node.nodeValue?.indexOf('}}') ?? -1;
            if (end == -1) continue;

            if (end + 2 != node.nodeValue?.length) {
                (node as Text).splitText(end + 2);
            }

            const newValue = values[actions.length];
            const oldValue = node.nodeValue;

            if (newValue?.constructor === Array) {
                const start = document.createTextNode('');
                const end = node;
                end.nodeValue = '';
                end.parentNode?.insertBefore(start, end);
                const action = function (start: Text, end: Text, newValue: any, oldValue: any) {
                    console.log('TODO: need to patch common');
                    if (newValue.length > oldValue.length) {
                        const l = newValue.length - oldValue.length;
                        for (let i = 0; i < l; i++) {
                            const { values, template } = newValue[i];
                            const fragment = template.content.cloneNode(true);
                            RenderWalk(fragment, values, []);
                            end.parentNode?.insertBefore(fragment, end) as Element;
                        }
                    } else if (newValue.length < oldValue.length) {
                        const { template } = oldValue[0];
                        let r = (oldValue.length - newValue.length)*template.content.childNodes.length;
                        while (r) {
                            end.parentNode?.removeChild(end.previousSibling as Node);
                            r--;
                        }
                    }

                    // for (const {strings, values, template} of newValue) {
                    //     const fragment = template.content.cloneNode(true);
                    //     RenderWalk(fragment,values, []);
                    //     end.parentNode?.insertBefore(fragment, end) as Element;
                    // }
                }.bind(null, start as Text, end as Text);

                action(newValue, []);

                actions.push(action);
            } else {
                const action = function (node: Text, newValue: any, oldValue: any) {
                    node.nodeValue = newValue;
                }.bind(null, node as Text);

                action(newValue, oldValue);

                actions.push(action);
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
                        action(values[actions.length], attribute.value);
                        actions.push(action);
                    } else {
                        const action = function (node: Element, attribute: Attr, newValue: any, oldValue: any) {
                            node.setAttribute(attribute.name, newValue);
                        }.bind(null, node as Element, attribute);
                        action(values[actions.length], attribute.value);
                        actions.push(action);
                    }
                }
            }
        }
    }
};

export default async function render(root: Element, context: any, component: any) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values, template } = component(html, context);

    let cache = RenderCache.get(strings);

    if (cache) {
        RenderRun(strings, values);
        return cache;
    }

    cache = {
        values,
        actions: [],
        rooted: false,
        fragment: template.content.cloneNode(true),
    };

    RenderCache.set(strings, cache);

    RenderWalk(cache.fragment, values, cache.actions);

    if (!cache.rooted) {
        cache.rooted = true;
        root.replaceChildren(cache.fragment);
    }

    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
