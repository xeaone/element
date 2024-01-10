import { InstanceSymbol, BindersCache } from './global';
import { Binder, Variables } from './types';
import { ATTRIBUTE_NODE } from './tools';
import { action } from './action';

export const bind = function (node: Node, variables: Variables, index: number) {

    // const type = node.nodeType;
    // const isAttribute = type === ATTRIBUTE_NODE;

    // const isFunction = typeof variables[ index ] === 'function';
    // const isInstance = isFunction && variables[ index ][InstanceSymbol];
    // const isOnce = isAttribute && (node as Attr)?.name.startsWith('on');
    // const isReactive = !isInstance && !isOnce && isFunction;

    const binder: Binder = {

        meta: {},
        result: undefined,

        nodeReference: new WeakRef(node),

        get node () {
            const node = this.nodeReference.deref();
            if (node) {
                return node;
            } else {
                BindersCache.delete(this);
                return null;
            }
        },

        ownerReference:
            (node as Attr).ownerElement || node.parentElement ?
            new WeakRef(((node as Attr).ownerElement ?? node.parentElement) as Element) : undefined,

        get owner () {
            const node = this.ownerReference?.deref();
            if (node) {
                return node;
            } else {
                BindersCache.delete(this);
                return null;
            }
        },

        get variable () {
            return variables[ index ];
        },

        remove () {
            BindersCache.delete(this);
        },

        replace (node: Node) {
            this.nodeReference = new WeakRef(node);
        },

        // isOnce,
        // isReactive,
        // isInstance,
        // isInitialized: false,
    };

    // if (isReactive) {
    //     BindersCache.add(binder);
    // }

    BindersCache.add(binder);

    action(binder);

};