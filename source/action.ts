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

    // const variables = binder.variables;

    // this optimization could prevent disconnected nodes from being render when re/connected
    // Note: Attr nodes do not change the isConnected prop
    // if (!node.isConnected && binder.isInitialized) {
    //     return;
    // }

    const variable = binder.variable;
    const isFunction = typeof variable === 'function';
    const isInstance = isFunction && (variable as any)[InstanceSymbol];
    const isOnce = binder.type === 3 && binder.name.startsWith('on');
    const isReactive = !isInstance && !isOnce && isFunction;

    if (isOnce || isInstance || !isFunction) {
        binder.remove();
    }

    const source = binder.source;
    const target = isReactive ? variable() : variable;

    if ('source' in binder && source === target) {
        return;
    }

    if (binder.type === 1) {
        element(node as Element, binder, source, target);
    } else if (binder.type === 2) {
        attributeName(node as Element, binder, source, target);
    } else if (binder.type === 3) {
        attributeValue(node as Element, binder, source, target);
    } else if (binder.type === 4) {
        text(node as Text, binder, source, target);
    } else {
        throw new Error('instruction type not valid');
    }

    binder.source = target;

};