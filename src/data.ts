import html from './html';
import roots from './roots';
import render from './render';
import { replaceChildren } from './poly';

export type ObserveValue = any;
export type ObserveTarget = any;
export type ObserveReceiver = any;
export type ObserveMethod = () => void;
export type ObserveKey = symbol | string;
export type ObserveData = Record<string, any>;

type Root = Element | ShadowRoot | DocumentFragment;

export class Data extends Function {
    html = html;
    // busy = true;
    self = this;
    root: Root;

    #actions: Array<(Old: any, New: any) => void> = [];
    #expressions: Array<any> = [];
    // component: any;
    // template: any;
    connecting?: () => void | Promise<void>;
    upgrading?: () => void | Promise<void>;
    upgraded?: () => void | Promise<void>;
    connected?: () => void | Promise<void>;
    // [key: string]: any;

    #busy = true;
    // #change: Change;

    constructor(root: Element, component: any) {
        super();
        this.root = root;
        // this.#change = change;
        // this.self = this;
        // this.root = root;
        // this.component = component;
        const self = new Proxy(this, {
            apply: (_t, _s, [strings, expressions]) => {
                return html(strings, ...expressions);
            },
            get: (t, k, r) => {
                if (k === 'html' || k === 'h') return html;
                if (k === 'root' || k === 'r') return root;
                if (k === 'self' || k === 's') return t;

                const v = Reflect.get(t, k, r);
                if (v && typeof v === 'object') {
                    return new Proxy(v, {
                        get: this.#get,
                        set: this.#set,
                        deleteProperty: this.#delete,
                    });
                } else {
                    return Reflect.get(t, k, r);
                }
            },
            set: (t, k, v, r) => {
                if (k === 'html' || k === 'h') return false;
                if (k === 'root' || k === 'r') return false;
                if (k === 'self' || k === 's') return false;
                return Reflect.set(t, k, v, r);
            },
        });

        const template = component(self, self);

        roots.set(root, self);

        const hyper = template();
        const fragment = hyper.template.content.cloneNode(true) as DocumentFragment;

        render(fragment, hyper.expressions, this.#actions);

        document.adoptNode(fragment);

        const length = this.#actions.length;
        for (let index = 0; index < length; index++) {
            const newExpression = hyper.expressions[index];
            this.#actions[index](undefined, newExpression);
            this.#expressions[index] = newExpression;
        }

        // root.dispatchEvent(connectingEvent);
        // await self?.connecting?.(fragment)?.catch(console.error);

        // root.dispatchEvent(upgradingEvent);
        // await self?.upgrading?.(fragment)?.catch(console.error);

        replaceChildren(root?.shadowRoot ?? root, fragment);

        // await self?.upgraded?.(fragment)?.catch(console.error);
        // root.dispatchEvent(upgradedEvent);

        // await self?.connected?.(root)?.catch(console.error);
        // root.dispatchEvent(connectedEvent);

        this.#busy = false;

        return self;
    }

    #get(target: ObserveTarget, key: ObserveKey, receiver: ObserveReceiver): ObserveValue {
        if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

        const value = Reflect.get(target, key, receiver);

        if (value && typeof value === 'object') {
            // if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
            // const cache = ObserveCache.get(value);
            // if (cache) return cache;

            const proxy = new Proxy(value, {
                get: this.#get,
                set: this.#set,
                deleteProperty: this.#delete,
            });

            // ObserveCache.set(value, proxy);
            return proxy;
        }

        // if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
        //     const cache = ObserveCache.get(value);
        //     if (cache) return cache;

        //     const proxy = new Proxy(value, {
        //         apply(t, _, a) {
        //             return Reflect.apply(t, receiver, a);
        //         },
        //     });

        //     ObserveCache.set(value, proxy);
        //     return proxy;
        // }

        return value;
    };


    #set(target: ObserveTarget, key: ObserveKey, value: ObserveValue, receiver: ObserveReceiver) {
        if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

        const from = Reflect.get(target, key, receiver);

        if (from === value) return true;
        if (Number.isNaN(from) && Number.isNaN(value)) return true;

        // if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
        //     const cache = ObserveCache.get(from);
        //     if (cache === value) return true;
        //     ObserveCache.delete(from);
        // }

        Reflect.set(target, key, value, receiver);

        this.#change();

        return true;
    }

    #delete(target: ObserveTarget, key: ObserveKey) {
        if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

        // const from = Reflect.get(target, key);
        // ObserveCache.delete(from);
        Reflect.deleteProperty(target, key);

        this.#change();

        return true;
    }

    #change() {

    }

}

// export default Observe;
