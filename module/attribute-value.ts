/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { dangerousLink, hasOn, isBool, isLink, isOnce, isValue, sliceOn } from './tools';
import { display } from './display';
import { update } from './update';
import { Binder } from './types';
import { event } from './event';
import { isTimeout } from './tools';

const isRadioChecked = function (element: Element) {
    if (element.nodeName === 'INPUT' && (element as HTMLInputElement).type === 'radio') {
        const radios = element.ownerDocument.querySelectorAll<HTMLInputElement>(`input[name="${(element as HTMLInputElement).name}"]`);
        for (const radio of radios) {
            if (radio.checked) {
                return radio.checked;
            }
        }
    }

    return false;
};

export const attributeValue = function (element: Element, binder: Binder, source: any, target: any): void {
    if (source === target) {
        return;
    }

    if (!binder.name) {
        console.warn('attribute binder name required');
        return;
    }

    if (isValue(binder.name)) {
        if (element.nodeName === 'SELECT') {
            const options = (element as HTMLSelectElement).options as HTMLOptionsCollection;
            const array = Array.isArray(target);
            for (const option of options) {
                option.selected = array ? target.includes(option.value) : `${target}` === option.value;
            }
        } else {
            binder.value = display(target);
            element.setAttribute(binder.name, binder.value);
            Reflect.set(element, binder.name, binder.value);
        }
    } else if (isLink(binder.name)) {
        binder.value = encodeURI(target);

        if (dangerousLink(binder.value)) {
            element.removeAttribute(binder.name);
            console.warn(`XElement - attribute name "${binder.name}" and value "${binder.value}" not allowed`);
            return;
        }

        element.setAttribute(binder.name, binder.value);
        Reflect.set(element, binder.name, binder.value);
    } else if (isBool(binder.name)) {
        const bool = !!target;

        if (bool) {
            element.setAttribute(binder.name, '');
        } else {
            element.removeAttribute(binder.name);
        }

        Reflect.set(element, binder.name, bool);
    } else if (hasOn(binder.name)) {
        // handle onanimation ontimeout

        if (element.hasAttribute(binder.name)) {
            element.removeAttribute(binder.name);
        }

        if (typeof binder.value === 'function') {
            element.removeEventListener(
                sliceOn(binder.name),
                binder.value,
                source?.[1] ?? true,
            );
        }

        const method = typeof target === 'function' ? target : target?.[0];

        if (typeof method !== 'function') {
            return console.warn(`XElement - attribute name "${binder.name}" expected a function`);
        }

        let oldResult: any;
        binder.value = function () {
            if (element.nodeName === 'INPUT' && (element as HTMLInputElement).type === 'radio') {
                const radios = element.ownerDocument.querySelectorAll<HTMLInputElement>(`input[name="${(element as HTMLInputElement).name}"]`);
                for (const radio of radios) {
                    if (radio.checked) {
                        oldResult = radio.checked;
                    }
                }
            }

            const newResult = method.call(this, event(binder));

            if (newResult !== oldResult) {
                oldResult = newResult;
                update();
            }

            return newResult;
        };

        if (isOnce(binder.name)) {
            binder.value();
        } else if (isTimeout(binder.name)) {
            setTimeout(binder.value, target?.[1]);
        } else {
            element.addEventListener(sliceOn(binder.name), binder.value, target?.[1] ?? true);
        }
    } else {
        binder.value = target;
        element.setAttribute(binder.name, binder.value);
        Reflect.set(element, binder.name, binder.value);
    }
};

// const attribute = function (node: Attr, binder: Binder, source: any, target: any) {
//     const name = node.name;
//     const value = node.value;

//     if (hasOn(name)) {

//         if (isAnimation(name)) {
//             // const variable = binder.result;
//             const isArray = Array.isArray(binder.result);
//             const method = isArray ? binder.result[ 0 ] : binder.result;
//             const handle = async () => {
//                 if (binder.owner?.isConnected) {
//                     const result = method();
//                     if (binder.result === result) {
//                         requestAnimationFrame(handle);
//                     } else {
//                         binder.result = result;
//                         await update();
//                         requestAnimationFrame(handle);
//                     }
//                 } else {
//                     requestAnimationFrame(handle);
//                 }
//             };
//             requestAnimationFrame(handle);
//         } else if (isTimeout(name)) {
//             // const variable = binder.variable;
//             // const isArray = Array.isArray(variable);
//             // const method = isArray ? variable[ 0 ] : variable;
//             // const time = isArray ? variable[ 1 ] : undefined;

//             const isArray = Array.isArray(binder.result);
//             const method = isArray ? binder.result[ 0 ] : binder.result;
//             const time = isArray ? binder.result[ 1 ] : undefined;
//             const handle = async () => {
//                 const result = method();
//                 if (binder.result === result) {
//                     return;
//                 } else {
//                     binder.result = result;
//                     await update();
//                 }
//             };
//             setTimeout(handle, time);
//         } else {
//             const owner = binder.owner;
//             if (owner) {
//                 const eventName = name.substring(2);
//                 const isArray = Array.isArray(result);
//                 const [ method, options ] = isArray ? result : [ result, undefined ];
//                 if (typeof method === 'function') {
//                     // owner.removeEventListener(eventName, result);
//                     owner.addEventListener(eventName, async function (event) {
//                         const returned = method(event);
//                         if (binder.meta.returned !== returned) {
//                             binder.meta.returned = returned;
//                             await update();
//                         }
//                     }, options);
//                     intersectionObserver.observe(owner);
//                 } else {
//                     console.error(`${name} requiures function or array with function`);
//                 }
//             }
//         }

//         const owner = binder.owner;
//         if (owner) {
//             owner.removeAttributeNode(node);
//         }

//     // } else if (isMarker(name)) {
//     } else if (value === '') {
//         if (name === result) {
//             if (!binder.owner?.hasAttribute(result)) {
//                 addAttribute(binder.owner as Element, node);
//                 Reflect.set(binder.owner as Element, result, true);
//             }
//         } else {
//             if (result) {
//                 removeAttribute(node);
//                 binder.replace(createAttribute(binder.owner as Element, result));
//                 Reflect.set(binder.owner as Element, result, true);
//             } else {
//                 removeAttribute(node);
//                 Reflect.set(binder.owner as Element, result, false);
//             }
//         }
//     } else if (result instanceof Attr) {

//     } else {
//         node.value = result;
//     }
// };
