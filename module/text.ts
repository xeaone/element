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
import { afterNode, beforeNode, isIterable, removeBetween, removeNode, replaceNode } from './tools';
import { MarkSymbol, ViewSymbol } from './global';
import { display } from './display';
import { Binder } from './types';

const iterableDisplay = function (data: any): Node | string {
    return data?.[ViewSymbol] ? data() : data instanceof Node ? data : display(data);
};

export const text = function (node: Text, binder: Binder, source: any, target: any): void {
    if (target === null || target === undefined) {
        if (node.textContent !== '') {
            node.textContent = '';
        }
    } else if (target?.[ViewSymbol]) {
        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        removeBetween(binder.start, binder.end);
        beforeNode(target(), binder.end);
    } else if (target instanceof DocumentFragment) {
        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        removeBetween(binder.start, binder.end);
        beforeNode(target, binder.end);
    } else if (isIterable(target)) {
        // console.log(target);

        if (binder.length === undefined) {
            binder.length = 0;
        }

        if (!binder.results) {
            binder.results = [];
        }

        if (!binder.markers) {
            binder.markers = [];
        }

        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        const oldLength = binder.length;
        const newLength = target.length;
        const commonLength = Math.min(oldLength, newLength);

        // todo: make this more efficient
        for (let index = 0; index < commonLength; index++) {
            if (
                target[index] === binder.results[index] ||
                target[index]?.[ViewSymbol] && binder.results[index]?.[ViewSymbol] && target[index]?.[MarkSymbol] === binder.results[index]?.[MarkSymbol]
            ) continue;

            const marker = binder.markers[index];
            const last = binder.markers[index + 1] ?? binder.end;
            while (last.previousSibling && last.previousSibling !== marker) {
                removeNode(last.previousSibling);
            }

            const child = iterableDisplay(target[index]);
            afterNode(child, marker);
            console.log(binder.results[index], target[index], child, marker);

            binder.results[index] = target[index];
        }

        if (oldLength < newLength) {
            while (binder.length !== target.length) {
                const marker = document.createTextNode('');
                const child = iterableDisplay(target[binder.length]);

                binder.markers.push(marker);
                binder.results.push(target[binder.length]);

                beforeNode(marker, binder.end);
                beforeNode(child, binder.end);
                binder.length++;
            }
        } else if (oldLength > newLength) {
            // const last = binder.markers[ target.length - 1 ];

            // while (binder.length !== target.length) {
            //     const previous = binder.end.previousSibling;
            //     if (previous === last) break;
            //     removeNode(previous as Node);
            // }

            const marker = binder.markers[target.length - 1];
            const last = binder.end;
            while (last.previousSibling && last.previousSibling !== marker) {
                removeNode(last.previousSibling);
            }

            binder.length = target.length;
            binder.results.length = target.length;
            binder.markers.length = target.length;
        }
    } else if (target instanceof Node) {
        replaceNode(target, node);
    } else {
        if (node.textContent === `${target}`) {
            return;
        } else {
            node.textContent = `${target}`;
        }
    }
};
