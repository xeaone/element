import display from './display';
// import booleans from './booleans';
import { symbol } from './html';
import { includes } from './poly';
import { Actions } from './types';

const filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;

const links = [ 'src', 'href', 'xlink:href' ];
const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const dangerousLink = function (data: string) {
    return typeof data !== 'string' || !safePattern.test(data);
};

const removeBetween = function (start: Node, end: Node) {
    let node = end.previousSibling;
    while (node !== start) {
        node?.parentNode?.removeChild(node);
        node = end.previousSibling;
    }
};

const ElementAction = function (this: {
    start: Text;
    end: Text;
    actions: Actions;
}, source: any, target: any) {

    if (target?.symbol === symbol) {

        source = source ?? {};
        target = target ?? {};

        if (source.strings === target.strings) {

            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[ i ](source.expressions[ i ], target.expressions[ i ]);
            }

        } else {
            const fragment = target.template.content.cloneNode(true);
            Render(fragment, this.actions);

            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[ i ](source.expressions?.[ i ], target.expressions[ i ]);
            }

            document.adoptNode(fragment);

            removeBetween(this.start, this.end);
            this.end.parentNode?.insertBefore(fragment, this.end);
        }

    } else if (target?.constructor === Array) {

        source = source ?? [];
        target = target ?? [];

        const oldLength = source.length;
        const newLength = target.length;
        const common = Math.min(oldLength, newLength);

        for (let i = 0; i < common; i++) {
            this.actions[ i ](source[ i ], target[ i ]);
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
                action(source[ i ], target[ i ]);
            }

            this.end.parentNode?.insertBefore(template.content, this.end);
        } else if (oldLength > newLength) {

            for (let i = oldLength - 1; i > newLength - 1; i--) {
                if (source[ i ]?.symbol === symbol) {
                    const { template } = source[ i ];
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
        if (source === target) return;

        while (this.end.previousSibling !== this.start) {
            this.end.parentNode?.removeChild(this.end.previousSibling as ChildNode);
        }

        let node;
        if (this.end.previousSibling === this.start) {
            node = document.createTextNode(target);
            this.end.parentNode?.insertBefore(node, this.end);
        } else {
            if (this.end.previousSibling.nodeType === Node.TEXT_NODE) {
                node = this.end.previousSibling;
                node.textContent = target;
            } else {
                node = document.createTextNode(target);
                this.end.parentNode?.removeChild(this.end.previousSibling as ChildNode);
                this.end.parentNode?.insertBefore(node, this.end);
            }
        }

    }

};

const AttributeNameAction = function (this: {
    element: Element,
    name: string,
    value: any,
}, source: any, target: any) {
    if (source === target) return;

    this.element.removeAttribute(source);
    this.name = target?.toLowerCase();

    if (this.name) {
        this.element.setAttribute(this.name, '');
    }

};

const AttributeValueAction = function (this: {
    element: Element,
    name: string,
    value: any,
}, source: any, target: any) {
    if (source === target) return;

    if (
        this.name === 'value'
    ) {
        this.value = display(target);
        Reflect.set(this.element, this.name, this.value);
        this.element.setAttribute(this.name, this.value);
    } else if (
        this.name.startsWith('on')
    ) {
        if (typeof source === 'function') this.element.removeEventListener(this.name.slice(2), source);
        this.value = target;
        if (typeof this.value !== 'function') return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
        this.element.addEventListener(this.name.slice(2), this.value);
        // } else if (
        //     includes(booleans, this.name)
        // ) {
        //     this.value = target ? true : false;

        //     if (this.value) this.element.setAttribute(this.name, '');
        //     else this.element.removeAttribute(this.name);

        //     Reflect.set(this.element, this.name, this.value);
    } else if (
        includes(links, this.name)
    ) {
        this.value = encodeURI(target);

        if (dangerousLink(this.value)) {
            this.element.removeAttribute(this.name);
            console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
            return;
        }

        Reflect.set(this.element, this.name, this.value);
        this.element.setAttribute(this.name, this.value);
    } else {
        this.value = target;
        if (this.name) {
            Reflect.set(this.element, this.name, this.value);
            this.element.setAttribute(this.name, this.value);
        }
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
            actions.push(ElementAction.bind({ start, end, actions: [], }));
        } else if (node.nodeType === Node.ELEMENT_NODE) {

            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }

            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';
                const dynamicName = name.includes('{{') && name.includes('}}');
                const dynamicValue = value.includes('{{') && value.includes('}}');

                if (dynamicName || dynamicValue) {
                    const meta = { element: node as Element, name, value };

                    if (dynamicName) {
                        index++;
                        (node as Element).removeAttribute(name);
                        actions.push(
                            AttributeNameAction.bind(meta)
                        );
                    }

                    if (dynamicValue) {
                        index++;
                        (node as Element).removeAttribute(name);
                        actions.push(
                            AttributeValueAction.bind(meta)
                        );
                    }

                } else {
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
