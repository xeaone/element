import { attributeName } from './attribute-name';
import { attributeValue } from './attribute-value';
import { hasOn, isConnected } from './tools';
import { ViewSymbol } from './global';
import { Binder } from './types';
import { event } from './event';
import { text } from './text';
import { MarkSymbol } from './global';

/**
 * @module Action
 * @todo need to handle element name changes
 * @todo need to handle attribute name changes
 * @todo
 */

const comment = function (node: Comment, data: any, source: any, target: any): void {
    console.warn('comment action not implemented');
};

const element = function (node: Element, data: any, source: any, target: any): void {
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
    const isInstance = isFunction && (variable as any)[ViewSymbol];
    const isOnce = binder.type === 3 && hasOn(binder.name);
    const isReactive = !isInstance && !isOnce && isFunction;

    if (isOnce || isInstance || !isFunction) {
        binder.remove();
    }

    const target = isReactive ? variable(event(binder)) : isInstance ? variable() : variable;

    const source = binder.source;
    if (
        'source' in binder &&
        (
            source === target ||
            source?.[ViewSymbol] && target?.[ViewSymbol] && source?.[MarkSymbol] === target?.[MarkSymbol]
        )
    ) {
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
