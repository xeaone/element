import display from './display';
import booleans from './booleans';
import { symbol } from './html';
import { includes } from './poly';
import { Attribute, Expressions, Actions, OldValue, NewValue } from './types';

// export type Value = any;
// export type OldValue = Value;
// export type NewValue = Value;
// export type Expressions = Array<Value>;
// export type Actions = Array<(oldValue: OldValue, newValue: NewValue) => void>;
// export type Attribute = { name: string, value: string };

const filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;

const links = ['src', 'href', 'xlink:href'];
const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const dangerousLink = function (data: string) {
    return typeof data !== 'string' || !safePattern.test(data);
};

const clear = function (start: Node, end: Node) {
    let node = end.previousSibling;
    while (node !== start) {
        node?.parentNode?.removeChild(node);
        node = end.previousSibling;
    }
};

const ElementAction = function (
    this: {
        start: Text;
        end: Text;
        actions: Actions;
    },
    oldValue: OldValue,
    newValue: NewValue
) {

    if (newValue?.symbol === symbol) {

        oldValue = oldValue ?? {};
        newValue = newValue ?? {};

        if (oldValue.strings === newValue.strings) {

            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[ i ](oldValue.expressions[ i ], newValue.expressions[ i ]);
            }

        } else {
            const fragment = newValue.template.content.cloneNode(true);
            Render(fragment, this.actions);

            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[ i ](oldValue.expressions?.[ i ], newValue.expressions[ i ]);
            }

            document.adoptNode(fragment);

            clear(this.start, this.end);
            this.end.parentNode?.insertBefore(fragment, this.end);
        }

    } else if (newValue?.constructor === Array) {

        oldValue = oldValue ?? [];
        newValue = newValue ?? [];

        const oldLength = oldValue.length;
        const newLength = newValue.length;
        const common = Math.min(oldLength, newLength);

        for (let i = 0; i < common; i++) {
            this.actions[ i ](oldValue[ i ], newValue[ i ]);
        }

        if (oldLength < newLength) {
            const template = document.createElement('template');

            for (let i = oldLength; i < newLength; i++) {

                const startChild = document.createTextNode('');
                const endChild = document.createTextNode('');
                const action = ElementAction.bind({ start: startChild, end: endChild, actions: [] });

                template.content.appendChild(startChild);
                template.content.appendChild(endChild);

                this.actions.push(action);
                action(oldValue[ i ], newValue[ i ]);
            }

            this.end.parentNode?.insertBefore(template.content, this.end);
        } else if (oldLength > newLength) {

            for (let i = oldLength - 1; i > newLength - 1; i--) {
                if (oldValue[ i ]?.symbol === symbol) {
                    const { template } = oldValue[ i ];
                    let removes = template.content.childNodes.length + 2;
                    while (removes--) this.end.parentNode?.removeChild(this.end.previousSibling as Node);
                } else {
                    this.end.parentNode?.removeChild(this.end.previousSibling as Node);
                    this.end.parentNode?.removeChild(this.end.previousSibling as Node);
                    this.end.parentNode?.removeChild(this.end.previousSibling as Node);
                }
            }

            this.actions.length = newLength;
        }

    } else {
        if (oldValue === newValue) return;

        while (this.end.previousSibling !== this.start) {
            this.end.parentNode?.removeChild(this.end.previousSibling as ChildNode);
        }

        let node;
        if (this.end.previousSibling === this.start) {
            node = document.createTextNode(newValue);
            this.end.parentNode?.insertBefore(node, this.end);
        } else {
            if (this.end.previousSibling.nodeType === Node.TEXT_NODE) {
                node = this.end.previousSibling;
                node.textContent = newValue;
            } else {
                node = document.createTextNode(newValue);
                this.end.parentNode?.removeChild(this.end.previousSibling as ChildNode);
                this.end.parentNode?.insertBefore(node, this.end);
            }
        }

    }

};

const AttributeOn = function (element: Element, attribute: Attribute, oldValue: OldValue, newValue: NewValue) {
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

const AttributeValue = function (element: Element, attribute: Attribute, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    attribute.value = value;
    Reflect.set(element, attribute.name, attribute.value);
    element.setAttribute(attribute.name, attribute.value);
};

const AttributeLink = function (element: Element, attribute: Attribute, oldValue: OldValue, newValue: NewValue) {
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

const AttributeStandard = function (element: Element, attribute: Attribute, oldValue: OldValue, newValue: NewValue) {
    if (oldValue === newValue) return;
    attribute.value = newValue;
    Reflect.set(element, attribute.name, attribute.value);
    element.setAttribute(attribute.name, attribute.value);
};

const AttributeName = function (element: Element, attribute: Attribute, oldValue: OldValue, newValue: NewValue) {
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

export const Render = function (fragment: DocumentFragment, actions: Actions) {
    const walker = document.createTreeWalker(document, filter, null);

    walker.currentNode = fragment;

    let index = 0;
    let node: Node | null = fragment.firstChild;

    while ((node = walker.nextNode()) !== null) {
        if (node.nodeType === Node.TEXT_NODE) {

            const startIndex = node.nodeValue?.indexOf('{{') ?? -1;

            if (startIndex == -1) continue;

            if (startIndex != 0) {
                (node as Text).splitText(startIndex);
                node = walker.nextNode() as Node;
            }

            const endIndex = node.nodeValue?.indexOf('}}') ?? -1;

            if (endIndex == -1) continue;

            if (endIndex + 2 != node.nodeValue?.length) {
                (node as Text).splitText(endIndex + 2);
            }

            index++;

            const start = document.createTextNode('');
            const end = node as Text;
            end.textContent = '';
            end.parentNode?.insertBefore(start, end);
            actions.push(ElementAction.bind({ start, end, actions:[], }));
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
