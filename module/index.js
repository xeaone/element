/**
* @version 10.0.0
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { MarkSymbol, TemplatesCache, TemplateSymbol, VariablesSymbol, ViewSymbol } from './global';
import { initialize } from './initialize';
import { update, updateAllSync } from './update';
import { define } from './define';
import { mark } from './tools';
import { style } from './style';
// const query = (node: Node, selector: Selector) => selector.reduce((n, s) => n[ s ], node);
export { define, style, update, updateAllSync };
// const connectedEvent = new CustomEvent('connected');
// const disconnectedEvent = new CustomEvent('disconnected');
// const intersectionElements: WeakMap<Element, { wasConnected: boolean; isIntersecting: boolean }> = new WeakMap();
// const intersectionObserver = new IntersectionObserver((entries) => {
//     for (const entry of entries) {
//         const intersectionElement = intersectionElements.get(entry.target);
//         if (!intersectionElement) {
//             intersectionElements.set(entry.target, { wasConnected: false, isIntersecting: entry.isIntersecting });
//         } else if (entry.target.isConnected === true && intersectionElement.wasConnected === false) {
//             intersectionElement.wasConnected = true;
//             intersectionElement.isIntersecting = entry.isIntersecting;
//             entry.target.dispatchEvent(connectedEvent);
//         } else if (entry.target.isConnected === false && intersectionElement.wasConnected === true) {
//             intersectionElement.wasConnected = false;
//             intersectionElement.isIntersecting = entry.isIntersecting;
//             entry.target.dispatchEvent(disconnectedEvent);
//         } else {
//             //
//         }
//     }
// }, {
//     threshold: 1,
//     // rootMargin: '100000%',
//     root: document.documentElement,
// });
// const ro = new ResizeObserver((entries) => {
//     for (const entry of entries) {
//         const { target } = entry;
//         if (target.isConnected) {
//             // console.log(entry);
//             console.log(target.isConnected, target.parentElement.value, target.value);
//             if (target?.parentElement?.value === target.value) {
//                 target.selected = true;
//             }
//             ro.unobserve(target);
//         }
//     }
// });
// const io = new IntersectionObserver((entries) => {
//     for (const entry of entries) {
//         const { target } = entry;
//         if (target.isConnected) {
//             console.log(target.isConnected, target);
//             // console.log(entry);
//             // if (target?.parentElement?.value === target.value) {
//             //     target.selected = true;
//             // }
//             // io.unobserve(target);
//         }
//     }
// }, {
//     threshold: 1,
//     // rootMargin: '100000%',
//     root: document.documentElement,
// });
// const observer = new MutationObserver(function (records) {
//     console.log(arguments);
// });
// observer.observe(document.body, { childList: true, subtree: true });
/**
 * @description
 * @param strings
 * @param variables
 * @returns {DocumentFragment}
 */
export const html = function (strings, ...variables) {
    let marker;
    let template;
    const cache = TemplatesCache.get(strings);
    if (cache) {
        marker = cache.marker;
        template = cache.template;
    }
    else {
        marker = mark();
        let innerHTML = '';
        const length = strings.length - 1;
        for (let index = 0; index < length; index++) {
            innerHTML += `${strings[index]}${marker}`;
        }
        innerHTML += strings[length];
        template = document.createElement('template');
        template.innerHTML = innerHTML;
        TemplatesCache.set(strings, { template, marker });
    }
    const meta = {
        [ViewSymbol]: true,
        [MarkSymbol]: marker,
        [TemplateSymbol]: template,
        [VariablesSymbol]: variables,
    };
    return Object.assign(initialize.bind(meta, template, variables, marker), meta);
};
