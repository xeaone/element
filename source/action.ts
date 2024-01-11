import { attributeName } from './attribute-name';
import { attributeValue } from './attribute-value';
import { InstanceSymbol } from './global';
import { Binder } from './types';
import { text } from './text';

/**
 * @module Action
 * @todo need to handle element name changes
 * @todo need to handle attribute name changes
 * @todo
 *
 */

const comment = function (node: Comment, data: any, source: any, target: any) {
    console.warn('comment action not implemented');
};

const element = function (node: Element, data: any, source: any, target: any) {
    console.warn('element action not implemented');
};

export const action = function (binder: Binder) {

    const node = binder.node;

    if (!node) {
        return;
    }

    const variables = binder.variables;

    // this optimization could prevent disconnected nodes from being render when re/connected
    // Note: Attr nodes do not change the isConnected prop
    // if (!node.isConnected && binder.isInitialized) {
    //     return;
    // }

    for (const instruction of binder.instructions) {
        const { type, data } = instruction;

        const variable = variables[ instruction.index ];
        const isFunction = typeof variable === 'function';
        const isInstance = isFunction && (variable as any)[InstanceSymbol];
        const isOnce = (type === 2 || type === 3) && data.name.startsWith('on');
        const isReactive = !isInstance && !isOnce && isFunction;

        // move this to the Binder
        if (!isReactive || isOnce) {
            binder.remove();
        }

        const source = data.source;
        const target = isReactive ? variable() : variable;

        if ('source' in data && source === target) {
            return;
        }

        if (instruction.type === 1) {
            element(node as Element, data, source, target);
        } else if (instruction.type === 2) {
            attributeName(node as Element, data, source, target);
        } else if (instruction.type === 3) {
            attributeValue(node as Element, data, source, target);
        } else if (instruction.type === 4) {
            text(node as Text, data, source, target);
        } else {
            throw new Error('instruction type not valid');
        }

        // data.source = target;
    }

};