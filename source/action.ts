import { attributeName } from './attribute-name';
import { attributeValue } from './attribute-value';
import { InstanceSymbol } from './global';
import { Binder } from './types';
import { update } from './update';
import { text } from './text';
import { isConnected } from './tools';

/**
 * @module Action
 * @todo need to handle element name changes
 * @todo need to handle attribute name changes
 * @todo
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

    // this optimization could prevent disconnected nodes from being render when re/connected
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
    if (!isConnected(node) && binder.isInitialized) {
        return;
    }

    const variable = binder.variable;
    const isFunction = typeof variable === 'function';
    const isInstance = isFunction && (variable as any)[InstanceSymbol];
    const isOnce = binder.type === 3 && binder.name.startsWith('on');
    const isReactive = !isInstance && !isOnce && isFunction;

    if (isOnce || isInstance || !isFunction) {
        binder.remove();
    }

    const query = (selector: string): Element | null =>
        (binder?.node?.getRootNode() as Element)?.querySelector(selector);

    const source = binder.source;
    const target = isReactive ? variable({ update, query }) : variable;

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
    binder.isInitialized = true;

};