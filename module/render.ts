/**
 * @version 9.1.9
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import { hasOn, isMarker, isValue, sliceOn, isLink, isBool, hasMarker, dangerousLink, removeBetween } from './tools';
import display from './display';
import { symbol } from './html';
import { Actions } from './types';

// const TEXT_NODE = Node.TEXT_NODE;
// const ELEMENT_NODE = Node.ELEMENT_NODE;
// const FILTER = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;

const FILTER = 1 + 4;
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const ElementAction = function (
    this: { start: Text, end: Text, actions: Actions, },
    source: any,
    target: any
): void {

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

            // const fragment = document.importNode(target.template.content, true);
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
        if (source === target) {
            return;
        } else if (this.end.previousSibling === this.start) {
            this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
        } else if (
            this.end.previousSibling?.nodeType === TEXT_NODE &&
            this.end.previousSibling?.previousSibling === this.start
        ) {
            this.end.previousSibling.textContent = display(target);
        } else {
            removeBetween(this.start, this.end);
            this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
        }
    }

};

const AttributeNameAction = function (
    this: { element: Element, name: string, value: any, },
    source: any,
    target: any
): void {
    if (source === target) {
        return;
    } else if (isValue(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, null);
    } else if (hasOn(source)) {
        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(source), this.value, true);
        }
    } else if (isLink(source)) {
        this.element.removeAttribute(source);
    } else if (isBool(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, false);
    } else if (source) {
        this.element.removeAttribute(source);
        Reflect.deleteProperty(this.element, source);
    }

    this.name = target?.toLowerCase() || '';

    if (!this.name) {
        return;
    } else if (hasOn(this.name)) {
        return
    } else if (isBool(this.name)) {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, true);
    } else {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, undefined);
    }

};

const AttributeValueAction = function (
    this: { element: Element, name: string, value: any, },
    source: any,
    target: any
): void {
    if (source === target) {
        return;
    } else if (isValue(this.name)) {

        this.value = display(target);
        if (!this.name) return;
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);

    } else if (hasOn(this.name)) {

    // console.log(this.name, source, target, this.element);
        if (!this.name) return;

        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(this.name), this.value, true);
        }

        if (typeof target !== 'function') {
            return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
        }

        this.value = function () { return target.call(this, ...arguments); };
        this.element.addEventListener(sliceOn(this.name), this.value, true);

    } else if (isLink(this.name)) {

        this.value = encodeURI(target);
        if (!this.name) return;

        if (dangerousLink(this.value)) {
            this.element.removeAttribute(this.name);
            console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
            return;
        }

        this.element.setAttribute(this.name, this.value);
    } else {
        this.value = target;
        if (!this.name) return;
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);
    }
};

const TagAction = function (
    this: { element: Element, holder: Text, },
    source: any,
    target: any
): void {
    if (source === target) return;

    const oldElement = this.element;

    if (target) {
        oldElement.parentNode?.removeChild(oldElement);

        const newElement = document.createElement(target) as Element;

        while (oldElement.firstChild) newElement.appendChild(oldElement.firstChild);

        if (oldElement.nodeType === ELEMENT_NODE) {
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
    const walker = document.createTreeWalker(fragment, FILTER, null);

    walker.currentNode = fragment;

    let node: Node | null = fragment.firstChild;

    while (node = walker.nextNode()) {

        if (holders.has(node.previousSibling as Node)) {
            holders.delete(node.previousSibling as Node);
            actions.push(() => undefined);
        }

        if (node.nodeType === TEXT_NODE) {

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
        } else if (node.nodeType === ELEMENT_NODE) {

            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }

            const tMeta: any = {
                element: node as Element,
            };

            if (isMarker(node.nodeName, marker)) {
                holders.add(node);
                tMeta.holder = document.createTextNode('');
                node.parentNode?.insertBefore(tMeta.holder, node);
                actions.push(TagAction.bind(tMeta));
            }

            const names = (node as Element).getAttributeNames();
            for (const name of names) {
                const value = (node as Element).getAttribute(name) ?? '';

                if (hasMarker(name, marker) || hasMarker(value, marker)) {

                    const aMeta = {
                        name,
                        value,
                        previous: undefined,
                        get element () {
                            return tMeta.element;
                        },
                    };

                    if (hasMarker(name, marker)) {
                        (node as Element).removeAttribute(name);
                        actions.push(AttributeNameAction.bind(aMeta));
                    }

                    if (hasMarker(value, marker)) {
                        (node as Element).removeAttribute(name);
                        actions.push(AttributeValueAction.bind(aMeta));
                    }

                } else {
                    if (isLink(name)) {
                        if (dangerousLink(value)) {
                            (node as Element).removeAttribute(name);
                            console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
                        }
                    } else if (hasOn(name)) {
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
