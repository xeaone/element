import { InstanceSymbol, TemplateSymbol, VariablesSymbol } from './global';
import { beforeNode, isIterable, removeBetween, removeNode, replaceNode } from './tools';
import { Binder } from './types';

export const text = function (node: Text, binder: Binder, source: any, target: any) {

    if (target === null || target === undefined) {
        if (node.textContent === '') {
            return;
        } else {
            node.textContent = '';
        }
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

            if (binder.results[ index ]?.[TemplateSymbol] === target[ index ]?.[TemplateSymbol]) {
                Object.assign(binder.results[ index ][VariablesSymbol], target[ index ][VariablesSymbol]);
            } else {
                binder.results[ index ] = target[ index ];
            }

        }

        if (oldLength < newLength) {
            while (binder.length !== target.length) {
                const marker = document.createTextNode('');
                binder.markers.push(marker);
                binder.results.push(target[ binder.length ]);
                beforeNode(marker, binder.end);
                // bind(marker, binder.results, binder.length);
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
        if (node.textContent === `${target}`) {
            return;
        } else {
            node.textContent = `${target}`;
        }
    }
};