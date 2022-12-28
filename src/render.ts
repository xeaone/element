import html from './html.ts';
import display from './display.ts';
import booleans from './booleans.ts';
import { HtmlSymbol } from './html.ts';
import schedule from './schedule.ts';
import Context from './context.ts';

const RootCache = new WeakMap();

const ObjectAction = function (start: Text, end: Text, actions: any[], oldValue: any, newValue: any) {
    oldValue = oldValue ?? {};
    newValue = newValue ?? {};

    if (oldValue?.strings !== newValue.strings) {
        let next;
        let node = end.previousSibling;
        while (node !== start) {
            next = node?.previousSibling as ChildNode;
            node?.parentNode?.removeChild(node);
            node = next;
        }

        const fragment = newValue.template.content.cloneNode(true);
        RenderWalk(fragment, newValue.values, actions);
        end.parentNode?.insertBefore(fragment, end);
    }

    for (let i = 0; i < actions.length; i++) {
        actions[i](oldValue.values?.[i], newValue.values[i]);
    }
};

const ArrayAction = function (start: Text, end: Text, actions: any[], oldValues: any, newValues: any) {
    oldValues = oldValues ?? [];
    newValues = newValues ?? [];

    const oldLength = oldValues.length;
    const newLength = newValues.length;
    const common = Math.min(oldLength, newLength);

    for (let i = 0; i < common; i++) {
        actions[i](oldValues[i], newValues[i]);
    }

    if (oldLength < newLength) {
        const template = document.createElement('template');
        for (let i = oldLength; i < newLength; i++) {
            if (newValues[i]?.constructor === Object && newValues[i].symbol === HtmlSymbol) {
                const start = document.createTextNode('');
                const end = document.createTextNode('');
                const action = ObjectAction.bind(null, start, end, [])
                template.content.appendChild(start);
                template.content.appendChild(end);
                actions.push(action);
                action(oldValues[i], newValues[i]);
            } else {
                const node = document.createTextNode('');
                const action = StandardAction.bind(null, node as Text);
                actions.push(action);
                template.content.appendChild(node);
                action(oldValues[i], newValues[i]);
            }
        }
        end.parentNode?.insertBefore(template.content as Node, end);
    } else if (oldLength > newLength) {
        for (let i = oldLength; i !== newLength; i--) {
            if (oldValues[i]?.constructor === Object && oldValues[i].symbol === HtmlSymbol) {
                const { template } = oldValues[i];
                let removes = template.content.childNodes.length + 2;
                while (removes--) end.parentNode?.removeChild(end.previousSibling as Node);
            } else {
                end.parentNode?.removeChild(end.previousSibling as Node);
            }
        }
        actions.length = newLength;
        // oldValues.length = newLength;
        // await schedule(actions, oldValues, newValues);
    }

};

const StandardAction = function (node: Text, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    node.textContent = newValue;
};

const AttributeOn = function (node: Element, name: string, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    if (typeof oldValue === 'function') node.removeEventListener(name, oldValue);
    node.addEventListener(name, newValue);
};

const AttributeBoolean = function (element: Element, name: string, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    const value = newValue ? true : false;
    if (value) element.setAttribute(name, '');
    else element.removeAttribute(name);
};

const AttributeValue = function (element: Element, name: string, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    Reflect.set(element, name, value);
    element.setAttribute(name, value);
};

const AttributeStandard = function (node: Element, name: string, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    node.setAttribute(name, newValue);
};

const RenderWalk = function (fragment: DocumentFragment, values: any[], actions: any[]) {
    const walker = document.createTreeWalker(document, 5, null);

    walker.currentNode = fragment;

    let index = 0;
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

            const newValue = values[index++];

            if (newValue?.constructor === Object && newValue.symbol === HtmlSymbol) {
                const start = document.createTextNode('');
                const end = node;
                end.nodeValue = '';
                end.parentNode?.insertBefore(start, end);
                const action = ObjectAction.bind(null, start as Text, end as Text, []);
                actions.push(action);
            } else if (newValue?.constructor === Array) {
                const start = document.createTextNode('');
                const end = node;
                end.nodeValue = '';
                end.parentNode?.insertBefore(start, end);
                const action = ArrayAction.bind(null, start as Text, end as Text, []);
                actions.push(action);
            } else {
                const action = StandardAction.bind(null, node as Text);
                actions.push(action);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';
                if (value.includes('{{') && value.includes('}}')) {
                    index++;

                    let action;

                    if (name === 'value') {
                        action = AttributeValue.bind(null, node as Element, name);
                    } else if (booleans.includes(name)) {
                        action = AttributeBoolean.bind(null, node as Element, name);
                    } else if (name.startsWith('on')) {
                        (node as Element).removeAttribute(name);
                        action = AttributeOn.bind(null, node as Element, name.slice(2));
                    } else {
                        action = AttributeStandard.bind(null, node as Element, name);
                    }

                    actions.push(action);
                }
            }
        } else {
            console.warn('node type not handled ', node.nodeType);
        }
    }
};

export default async function render(root: Element, context: any, component: any) {
    const update = async function () {
        if (context.upgrade) await context.upgrade()?.catch?.(console.error);
        const { values } = component(html, context);
        await schedule(instance.actions, instance.values, values);
        instance.values = values;
        if (context.upgraded) await context.upgraded()?.catch(console.error);
    };

    const cache = RootCache.get(root);

    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

    context = Context(context(html), update);

    RootCache.set(root, context);

    if (context.connect) await context.connect()?.catch?.(console.error);
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values, template } = component(html, context);

    const instance = {
        values,
        strings,
        template,
        actions: [],
        fragment: template.content.cloneNode(true),
    };

    RenderWalk(instance.fragment, instance.values, instance.actions);

    await schedule(instance.actions, [], instance.values);

    root.replaceChildren(instance.fragment);

    if (context.upgraded) await context.upgraded()?.catch(console.error);
    if (context.connected) await context.connected()?.catch(console.error);
}
