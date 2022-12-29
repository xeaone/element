import html from './html.ts';
import display from './display.ts';
import observe from './observe.ts';
import booleans from './booleans.ts';
import { HtmlSymbol } from './html.ts';

type Value = any;
type OldValue = Value;
type NewValue = Value;
type Values = Array<Value>;
type Actions = Array<(oldValue: OldValue, newValue: NewValue) => void>;

const RootCache = new WeakMap();

const ObjectAction = function (start: Text, end: Text, actions: Actions, oldValue: OldValue, newValue: NewValue) {
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

        const l = actions.length;
        for (let i = 0; i < l; i++) {
            actions[i](oldValue.values?.[i], newValue.values[i]);
        }

        end.parentNode?.insertBefore(fragment, end);
    } else {
        const l = actions.length;
        for (let i = 0; i < l; i++) {
            actions[i](oldValue.values?.[i], newValue.values[i]);
        }
    }
};

const ArrayAction = function (start: Text, end: Text, actions: Actions, oldValue: OldValue, newValue: NewValue) {
    oldValue = oldValue ?? [];
    newValue = newValue ?? [];

    const oldLength = oldValue.length;
    const newLength = newValue.length;
    const common = Math.min(oldLength, newLength);

    for (let i = 0; i < common; i++) {
        actions[i](oldValue[i], newValue[i]);
    }

    if (oldLength < newLength) {
        const template = document.createElement('template');
        for (let i = oldLength; i < newLength; i++) {
            if (newValue[i]?.constructor === Object && newValue[i]?.symbol === HtmlSymbol) {
                const start = document.createTextNode('');
                const end = document.createTextNode('');
                const action = ObjectAction.bind(null, start, end, []);
                template.content.appendChild(start);
                template.content.appendChild(end);
                actions.push(action);
                action(oldValue[i], newValue[i]);
            } else {
                const node = document.createTextNode('');
                const action = StandardAction.bind(null, node as Text);
                template.content.appendChild(node);
                actions.push(action);
                action(oldValue[i], newValue[i]);
            }
        }
        end.parentNode?.insertBefore(template.content as Node, end);
    } else if (oldLength > newLength) {
        for (let i = oldLength; i !== newLength; i--) {
            if (oldValue[i]?.constructor === Object && oldValue[i]?.symbol === HtmlSymbol) {
                const { template } = oldValue[i];
                let removes = template.content.childNodes.length + 2;
                while (removes--) end.parentNode?.removeChild(end.previousSibling as Node);
            } else {
                end.parentNode?.removeChild(end.previousSibling as Node);
            }
        }
        actions.length = newLength;
    }
};

const StandardAction = function (node: Text, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    node.textContent = newValue;
};

const AttributeOn = function (node: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    if (typeof oldValue === 'function') node.removeEventListener(attribute.name.slice(2), oldValue);
    node.addEventListener(attribute.name.slice(2), newValue);
};

const AttributeBoolean = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    const value = newValue ? true : false;
    if (value) element.setAttribute(attribute.name, '');
    else element.removeAttribute(attribute.name);
};

const AttributeValue = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    Reflect.set(element, attribute.name, value);
    element.setAttribute(attribute.name, value);
};

const AttributeStandard = function (node: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    attribute.value = newValue;
    node.setAttribute(attribute.name, attribute.value);
};

const AttributeName = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    attribute.name = newValue;
    element.removeAttribute(oldValue);
    element.setAttribute(attribute.name, attribute.value);
};

const RenderWalk = function (fragment: DocumentFragment, values: Values, actions: Actions) {
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

            if (newValue?.constructor === Object && newValue?.symbol === HtmlSymbol) {
                const start = document.createTextNode('');
                const end = node;
                end.nodeValue = '';
                end.parentNode?.insertBefore(start, end);
                actions.push(ObjectAction.bind(null, start as Text, end as Text, []));
            } else if (newValue?.constructor === Array) {
                const start = document.createTextNode('');
                const end = node;
                end.nodeValue = '';
                end.parentNode?.insertBefore(start, end);
                actions.push(ArrayAction.bind(null, start as Text, end as Text, []));
            } else {
                actions.push(StandardAction.bind(null, node as Text));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';
                const attribute = { name, value };

                if (name.includes('{{') && name.includes('}}')) {
                    index++;
                    (node as Element).removeAttribute(name);
                    actions.push(
                        AttributeName.bind(null, node as Element, attribute),
                    );
                }

                if (value.includes('{{') && value.includes('}}')) {
                    index++;
                    if (name === 'value') {
                        actions.push(
                            AttributeValue.bind(null, node as Element, attribute),
                        );
                    } else if (booleans.includes(name)) {
                        actions.push(
                            AttributeBoolean.bind(null, node as Element, attribute),
                        );
                    } else if (name.startsWith('on')) {
                        (node as Element).removeAttribute(name);
                        actions.push(
                            AttributeOn.bind(null, node as Element, attribute),
                        );
                    } else {
                        actions.push(
                            AttributeStandard.bind(null, node as Element, attribute),
                        );
                    }
                }
            }
        } else {
            console.warn('node type not handled ', node.nodeType);
        }
    }
};

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time ?? 0));

const render = async function (root: Element, context: any, component: any) {
    const instance: any = {};

    const update = async function () {
        if (instance.busy) return;
        else instance.busy = true;

        await sleep(50);

        if (context.upgrade) await context.upgrade()?.catch?.(console.error);

        const { values } = component(html, context);

        const length = instance.actions.length;
        for (let index = 0; index < length; index++) {
            instance.actions[index](instance.values[index], values[index]);
        }

        instance.values = values;

        if (context.upgraded) await context.upgraded()?.catch(console.error);

        instance.busy = false;
    };

    const cache = RootCache.get(root);

    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

    context = observe(context(html), update);

    RootCache.set(root, context);

    if (context.connect) await context.connect()?.catch?.(console.error);
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { strings, values, template } = component(html, context);

    instance.busy = false;
    instance.actions = [];
    instance.values = values;
    instance.strings = strings;
    instance.template = template;
    instance.fragment = template.content.cloneNode(true);

    RenderWalk(instance.fragment, instance.values, instance.actions);

    const length = instance.actions.length;
    for (let index = 0; index < length; index++) {
        instance.actions[index](undefined, values[index]);
    }

    root.replaceChildren(instance.fragment);

    if (context.upgraded) await context.upgraded()?.catch(console.error);
    if (context.connected) await context.connected()?.catch(console.error);
};

export default render;
