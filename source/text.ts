import { InstanceSymbol, TemplateSymbol, VariablesSymbol } from './global';
import { beforeNode, isIterable, removeBetween, removeNode } from './tools';
import { Binder } from './types';

export const text = function (node: Text, data: any, source: any, target: any) {

    if (target === null || target === undefined) {
        if (node.textContent === '') {
            return;
        } else {
            node.textContent = '';
        }
    } else if (target instanceof Node) {

        if (!data.start) {
            data.start = document.createTextNode('');
            beforeNode(data.start, node);
        }

        if (!data.end) {
            node.textContent = '';
            data.end = node;
        }

        removeBetween(data.start, data.end);
        beforeNode(target, data.end);

    } else if (target?.[ InstanceSymbol ]) {

        if (!data.start) {
            data.start = document.createTextNode('');
            beforeNode(data.start, node);
        }

        if (!data.end) {
            node.textContent = '';
            data.end = node;
        }

        removeBetween(data.start, data.end);
        beforeNode(target(), data.end);

    } else if (isIterable(target)) {

        if (data.length === undefined) {
            data.length = 0;
        }

        if (!data.results) {
            data.results = [];
        }

        if (!data.markers) {
            data.markers = [];
        }

        if (!data.start) {
            data.start = document.createTextNode('');
            beforeNode(data.start, node);
        }

        if (!data.end) {
            node.textContent = '';
            data.end = node;
        }

        const oldLength = data.length;
        const newLength = target.length;
        const commonLength = Math.min(oldLength, newLength);

        for (let index = 0; index < commonLength; index++) {

            if (data.results[ index ]?.[TemplateSymbol] === target[ index ]?.[TemplateSymbol]) {
                Object.assign(data.results[ index ][VariablesSymbol], target[ index ][VariablesSymbol]);
            } else {
                data.results[ index ] = target[ index ];
            }

        }

        if (oldLength < newLength) {
            while (data.length !== target.length) {
                const marker = document.createTextNode('');
                data.markers.push(marker);
                data.results.push(target[ data.length ]);
                beforeNode(marker, data.end);
                // bind(marker, data.results, data.length);
                data.length++;
            }
        } else if (oldLength > newLength) {
            const last = data.markers[ target.length - 1 ];

            while (data.length !== target.length) {
                // const previous = data.end.previousSibling;
                // removeNode(previous as Node);
                // const last = data.markers[ data.markers.length - 1 ];
                // if (previous === last) {
                //     data.markers.pop();
                //     data.results.pop();
                //     data.length--;
                // }

                const previous = data.end.previousSibling;
                if (previous === last) break;
                removeNode(previous as Node);
            }

            data.length = target.length;
            data.results.length = target.length;
            data.markers.length = target.length;
        }

    } else {
        if (node.textContent === `${target}`) {
            return;
        } else {
            node.textContent = `${target}`;
        }
    }
};