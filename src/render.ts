import display from './display';
import { symbol } from './html';
import { includes } from './poly';
import { Actions } from './types';

const filter = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;

const links = [ 'src', 'href', 'xlink:href' ];
const safePattern = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const dangerousLink = function (data: string) {
    if (data === '') return false;
    if (typeof data !== 'string') return false;
    return safePattern.test(data) ? false : true;
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
            this.actions.length = 0;
            const fragment = target.template.content.cloneNode(true);
            Render(fragment, this.actions, target.marker);

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
                const action = ElementAction.bind({
                    start: startChild,
                    end: endChild,
                    actions: []
                });

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

        if (typeof source !== typeof target) {
            while (this.end.previousSibling !== this.start) {
                this.end.parentNode?.removeChild(this.end.previousSibling as ChildNode);
            }
        }

        let node;
        if (this.end.previousSibling === this.start) {
            node = document.createTextNode(target);
            this.end.parentNode?.insertBefore(node, this.end);
        } else {
            if (this.end.previousSibling?.nodeType === Node.TEXT_NODE) {
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
    previousName?: string,
    previous?: Element,
    element: Element,
    name: string,
    value: any,
}, source: any, target: any) {
    if (source === target && this.previous === this.element) return;

    this.previous = this.element;

    this.previousName = source;

    Reflect.set(this.element, source, undefined);
    this.element.removeAttribute(source);
    this.name = target?.toLowerCase();

    if (this.name) {
        this.element.setAttribute(this.name, '');
    }

};

const AttributeValueAction = function (this: {
    previousName?: string,
    previous?: Element;
    element: Element,
    name: string,
    value: any,
}, source: any, target: any) {
    if (source === target && this.previous === this.element) return;

    this.previous = this.element;

    if (
        this.name === 'value'
    ) {
        this.value = display(target);
        if (!this.name) return;
        Reflect.set(this.element, this.name, this.value);
        this.element.setAttribute(this.name, this.value);
    } else if (
        this.name.startsWith('on')
    ) {

        if (typeof source === 'function') {
            this.element.removeEventListener(this.name.slice(2), source);
            if (this.previousName) this.element.removeEventListener(this.previousName?.slice(2), source);
        }

        this.value = target;
        if (typeof this.value !== 'function') return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);

        if (!this.name) return;

        this.element.addEventListener(this.name.slice(2), this.value);
    } else if (
        includes(links, this.name)
    ) {
        this.value = encodeURI(target);

        if (!this.name) return;

        if (dangerousLink(this.value)) {
            this.element.removeAttribute(this.name);
            console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
            return;
        }

        Reflect.set(this.element, this.name, this.value);
        this.element.setAttribute(this.name, this.value);
    } else {
        this.value = target;
        if (!this.name) return;
        Reflect.set(this.element, this.name, this.value);
        this.element.setAttribute(this.name, this.value);
    }
};

const TagAction = function (this: {
    element: Element,
    holder: Text,
}, source: any, target: any) {
    if (source === target) return;

    const oldElement = this.element;

    if (target) {
        oldElement.parentNode?.removeChild(oldElement);

        const newElement = document.createElement(target) as Element;

        while (oldElement.firstChild) newElement.appendChild(oldElement.firstChild);

        if (oldElement.nodeType === Node.ELEMENT_NODE) {
            const attributeNames = (oldElement as Element).getAttributeNames();
            for (const attributeName of attributeNames) {
                const attributeValue = (oldElement as Element).getAttribute(attributeName) ?? '';
                newElement.setAttribute(attributeName, attributeValue);
            }
        }

        this.holder.parentNode?.insertBefore(newElement, this.holder);
        this.element = newElement;
    } else {
        oldElement.parentNode?.removeChild(oldElement);
        this.element = oldElement;
    }

};

export const Render = function (fragment: DocumentFragment, actions: Actions, marker: string) {
    const holders = new WeakSet();
    const walker = document.createTreeWalker(document, filter, null);

    walker.currentNode = fragment;

    let node: Node | null = fragment.firstChild;

    while (node = walker.nextNode()) {

        if (holders.has(node.previousSibling as Node)) {
            holders.delete(node.previousSibling as Node);
            actions.push(() => undefined);
        }

        if (node.nodeType === Node.TEXT_NODE) {

            const startIndex = node.nodeValue?.indexOf(marker) ?? -1;
            if (startIndex === -1) continue;

            if (startIndex !== 0) {
                (node as Text).splitText(startIndex);
                node = walker.nextNode() as Node;
            }

            const endIndex = marker.length;
            if (endIndex !== node.nodeValue?.length) {
                (node as Text).splitText(endIndex);
            }

            const start = document.createTextNode('');
            const end = node as Text;

            end.textContent = '';
            end.parentNode?.insertBefore(start, end);

            actions.push(ElementAction.bind({ marker, start, end, actions: [], }));
        } else if (node.nodeType === Node.ELEMENT_NODE) {

            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }

            const tMeta: any = {
                element: node as Element,
            };

            if (node.nodeName === marker) {
                holders.add(node);
                tMeta.holder = document.createTextNode('');
                node.parentNode?.insertBefore(tMeta.holder, node);
                actions.push(TagAction.bind(tMeta));
            }

            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';
                const dynamicName = (name.toUpperCase()).includes(marker);
                const dynamicValue = value.includes(marker);

                if (dynamicName || dynamicValue) {

                    const aMeta = {
                        name,
                        value,
                        previous: undefined,
                        get element () {
                            return tMeta.element;
                        },
                    };

                    if (dynamicName) {
                        (node as Element).removeAttribute(name);
                        actions.push(AttributeNameAction.bind(aMeta));
                    }

                    if (dynamicValue) {
                        (node as Element).removeAttribute(name);
                        actions.push(AttributeValueAction.bind(aMeta));
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
