/**
* @version 10.0.4
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { dangerousLink, ELEMENT_NODE, hasMarker, hasOn, isLink, matchMarker, replaceChildren, SHOW_ELEMENT, SHOW_TEXT, TEXT_NODE } from './tools';
import { ContainersCache } from './global';
import { Reference } from './reference';
import { action } from './action';
// import { update } from './update';
import { bind } from './bind';
const FILTER = SHOW_ELEMENT + SHOW_TEXT;
export const initialize = function (template, variables, marker, container) {
    if (typeof container === 'string') {
        const selection = document.querySelector(container);
        if (!selection)
            throw new Error('query not found');
        const cache = ContainersCache.get(selection);
        if (cache && cache === template) {
            // update();
            return selection;
        }
        else {
            ContainersCache.set(selection, template);
        }
    }
    else if (container instanceof Element || container instanceof ShadowRoot) {
        const cache = ContainersCache.get(container);
        if (cache && cache === template) {
            // update();
            return container;
        }
        else {
            ContainersCache.set(container, template);
        }
    }
    const binders = [];
    const fragment = template.content.cloneNode(true);
    const walker = document.createTreeWalker(fragment, FILTER, null);
    let node;
    let index = 0;
    while (walker.nextNode()) {
        node = walker.currentNode;
        const type = node.nodeType;
        if (type === TEXT_NODE) {
            let text = node;
            const startIndex = text.nodeValue?.indexOf(marker) ?? -1;
            if (startIndex === -1)
                continue;
            if (startIndex !== 0) {
                text.splitText(startIndex);
                node = walker.nextNode();
                text = node;
            }
            const endIndex = marker.length;
            if (endIndex !== text.nodeValue?.length) {
                text.splitText(endIndex);
            }
            const referenceNode = Reference(text);
            const binder = bind(4, index++, variables, referenceNode);
            binders.unshift(binder);
            // action(binder);
        }
        else if (type === ELEMENT_NODE) {
            const element = node;
            const tag = element.tagName;
            if (tag === 'STYLE' || tag === 'SCRIPT') {
                walker.nextSibling();
            }
            let referenceNode;
            if (matchMarker(tag, marker)) {
                referenceNode = Reference(node);
                const binder = bind(1, index++, variables, referenceNode);
                binders.unshift(binder);
                // action(binder);
            }
            const names = element.getAttributeNames();
            for (const name of names) {
                const value = element.getAttribute(name) ?? '';
                const matchMarkerName = matchMarker(name, marker);
                const hasMarkerValue = hasMarker(value, marker);
                if (matchMarkerName || hasMarkerValue) {
                    referenceNode = referenceNode ?? Reference(node);
                    if (matchMarkerName && hasMarkerValue) {
                        const referenceName = Reference('');
                        const referenceValue = Reference('');
                        const binderName = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
                        const binderValue = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
                        element.removeAttribute(name);
                        binders.unshift(binderName);
                        binders.unshift(binderValue);
                        // action(binderName);
                        // action(binderValue);
                    }
                    else if (matchMarkerName) {
                        const referenceName = Reference('');
                        const referenceValue = Reference(value);
                        const binder = bind(2, index++, variables, referenceNode, referenceName, referenceValue);
                        element.removeAttribute(name);
                        binders.unshift(binder);
                        // action(binder);
                    }
                    else if (hasMarkerValue) {
                        const referenceName = Reference(name);
                        const referenceValue = Reference('');
                        const binder = bind(3, index++, variables, referenceNode, referenceName, referenceValue);
                        element.removeAttribute(name);
                        binders.unshift(binder);
                        // action(binder);
                    }
                }
                else {
                    if (isLink(name)) {
                        if (dangerousLink(value)) {
                            element.removeAttribute(name);
                            console.warn(`attribute name "${name}" and value "${value}" not allowed`);
                        }
                    }
                    else if (hasOn(name)) {
                        element.removeAttribute(name);
                        console.warn(`attribute name "${name}" not allowed`);
                    }
                }
            }
        }
        else {
            console.warn(`walker node type "${type}" not handled`);
        }
    }
    for (const binder of binders) {
        action(binder);
    }
    if (typeof container === 'string') {
        const selection = document.querySelector(container);
        if (!selection)
            throw new Error('query not found');
        replaceChildren(selection, fragment);
        return selection;
    }
    else if (container instanceof Element || container instanceof ShadowRoot) {
        replaceChildren(container, fragment);
        return container;
    }
    else {
        return fragment;
    }
};
