import { beforeNode, isIterable, removeBetween, removeNode, replaceNode } from './tools.ts';
import { InstanceSymbol, TemplateSymbol, VariablesSymbol } from './global.ts';
import { Binder } from './types.ts';
import display from './display.ts';

const iterableDisplay = function (data: any): Node | string {
    return data?.[ InstanceSymbol ] ? data() : data instanceof Node ? data : display(data);
};

export const text = function (node: Text, binder: Binder, source: any, target: any): void {
    if (target === null || target === undefined) {
        if (node.textContent !== '') {
            node.textContent = '';
        }
        // } else if (target instanceof Node || target?.[ InstanceSymbol ]) {
    } else if (target instanceof DocumentFragment || target?.[ InstanceSymbol ]) {
        if (!binder.start) {
            binder.start = document.createTextNode('');
            beforeNode(binder.start, node);
        }

        if (!binder.end) {
            node.textContent = '';
            binder.end = node;
        }

        removeBetween(binder.start, binder.end);
        beforeNode(typeof target === 'function' ? target() : target, binder.end);
    } else if (target instanceof Node) {
        console.log('replaceNode', binder);
        replaceNode(target, node);
    } else if (isIterable(target)) {
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

        for (let index = 0; index < commonLength; index++) {
            if (binder.results[ index ]?.[ TemplateSymbol ] === target[ index ]?.[ TemplateSymbol ]) {
                Object.assign(binder.results[ index ][ VariablesSymbol ], target[ index ][ VariablesSymbol ]);
            } else {
                binder.results[ index ] = target[ index ];
            }
        }

        if (oldLength < newLength) {
            while (binder.length !== target.length) {
                const marker = document.createTextNode('');
                binder.markers.push(marker);

                const child = iterableDisplay(target[ binder.length ]);

                binder.results.push(child);
                beforeNode(marker, binder.end);
                beforeNode(child, binder.end);
                binder.length++;
            }
        } else if (oldLength > newLength) {
            const last = binder.markers[ target.length - 1 ];

            while (binder.length !== target.length) {
                // const previous = binder.end.previousSibling;
                // removeNode(previous as Node);
                // const last = binder.markers[ binder.markers.length - 1 ];
                // if (previous === last) {
                //     binder.markers.pop();
                //     binder.results.pop();
                //     binder.length--;
                // }

                const previous = binder.end.previousSibling;
                if (previous === last) break;
                removeNode(previous as Node);
            }

            binder.length = target.length;
            binder.results.length = target.length;
            binder.markers.length = target.length;
        }
    } else {
        console.log('text', binder);

        if (node.textContent === `${target}`) {
            return;
        } else {
            node.textContent = `${target}`;
        }
    }
};
