import display from './display';
import booleans from './booleans';
import { HtmlSymbol } from './html';
import { includes } from './poly';

export type Value = any;
export type OldValue = Value;
export type NewValue = Value;
export type Expressions = Array<Value>;
export type Actions = Array<(oldValue: OldValue, newValue: NewValue) => void>;

const filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;

const links= [ 'src', 'href', 'xlink:href' ];
const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const dangerousLink = function (data: string) {
    return typeof data !== 'string' || !safePattern.test(data);
};

const ObjectAction = function (start: Text, end: Text, actions: Actions, oldValue: OldValue, newValue: NewValue) {
    // console.log('Object Action');

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
        Render(fragment, newValue.expressions, actions);
        document.adoptNode(fragment);

        const l = actions.length;
        for (let i = 0; i < l; i++) {
            actions[i](oldValue.expressions?.[i], newValue.expressions[i]);
        }

        end.parentNode?.insertBefore(fragment, end);
    } else {
        const l = actions.length;
        for (let i = 0; i < l; i++) {
            actions[i](oldValue.expressions?.[i], newValue.expressions[i]);
        }
    }
};

const ArrayAction = function (start: Text, end: Text, actions: Actions, oldValue: OldValue, newValue: NewValue) {
    // console.log('Array Action');

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

        for (let i = oldLength-1; i > newLength-1; i--) {

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

const AttributeOn = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    if (typeof oldValue === 'function') element.removeEventListener(attribute.name.slice(2), oldValue);
    if (typeof newValue !== 'function') return console.warn(`XElement - attribute name "${attribute.name}" and value "${newValue}" not allowed`);
    element.addEventListener(attribute.name.slice(2), newValue);
};

const AttributeBoolean = function (element: Element, attribute: { name: string; value: any }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;

    const value = newValue ? true : false;
    if (value) element.setAttribute(attribute.name, '');
    else element.removeAttribute(attribute.name);

    attribute.value = value;
    Reflect.set(element, attribute.name, attribute.value);
};

const AttributeValue = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    attribute.value = value;
    Reflect.set(element, attribute.name, attribute.value);
    element.setAttribute(attribute.name, attribute.value);
};

const AttributeLink = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;

    const value = encodeURI(newValue);

    if (dangerousLink(value)) {
        element.removeAttribute(attribute.name);
        console.warn(`XElement - attribute name "${attribute.name}" and value "${value}" not allowed`);
        return;
    }

    attribute.value = value;
    Reflect.set(element, attribute.name, attribute.value);
    element.setAttribute(attribute.name, attribute.value);
};

const AttributeStandard = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    attribute.value = newValue;
    Reflect.set(element, attribute.name, attribute.value);
    element.setAttribute(attribute.name, attribute.value);
};

const AttributeName = function (element: Element, attribute: { name: string; value: string }, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    element.removeAttribute(oldValue);

    const name = newValue?.toLowerCase();

    if (name === 'value') {
        attribute.name = name;
        AttributeValue(element, attribute, attribute.value, attribute.value);
    } else if (name.startsWith('on')) {
        console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
    } else if (includes(links, name)) {
        console.warn(`XElement - dynamic attribute name "${newValue}" not allowed`);
    } else if (includes(booleans, name)) {
        attribute.name = name;
        AttributeBoolean(element, attribute, attribute.value, attribute.value);
    } else {
        attribute.name = name;
        AttributeStandard(element, attribute, attribute.value, attribute.value);
    }

};

export const Render = function (fragment: DocumentFragment, expressions: Expressions, actions: Actions) {
    const walker = document.createTreeWalker(document, filter, null);

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

            const newValue = expressions[index++];

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
                (node as Text).textContent = '';
                actions.push(StandardAction.bind(null, node as Text));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {

            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }

            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';
                const attribute = { name, value };

                const dynamicName = name.includes('{{') && name.includes('}}');
                const dynamicValue = value.includes('{{') && value.includes('}}');

                if (dynamicName) {
                    index++;
                    (node as Element).removeAttribute(name);
                    actions.push(
                        AttributeName.bind(null, node as Element, attribute),
                    );
                }

                if (dynamicValue) {
                    index++;
                    (node as Element).removeAttribute(name);
                    if (name === 'value') {
                        actions.push(
                            AttributeValue.bind(null, node as Element, attribute),
                        );
                    } else if (name.startsWith('on')) {
                        actions.push(
                            AttributeOn.bind(null, node as Element, attribute),
                        );
                    } else if (includes(links, name)) {
                        actions.push(
                            AttributeLink.bind(null, node as Element, attribute),
                        );
                    } else if (includes(booleans, name)) {
                        actions.push(
                            AttributeBoolean.bind(null, node as Element, attribute),
                        );
                    } else {
                        actions.push(
                            AttributeStandard.bind(null, node as Element, attribute),
                        );
                    }
                }

                if (!dynamicName && !dynamicValue) {
                    if (includes(links, name)) {
                        if (dangerousLink(value)) {
                            (node as Element).removeAttribute(name);
                            console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
                        }
                    } else if (name.startsWith('on')) {
                        (node as Element).removeAttribute(name);
                        console.warn(`XElement - attribute name "${name}" not allowed`);
                    }
                }

            }
        } else {
            console.warn(`XElement - node type "${node.nodeType}" not handled`);
        }
    }
};

export default Render;
