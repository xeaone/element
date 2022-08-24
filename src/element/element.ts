import { ContextDelete, ContextGet, ContextSet } from './context';
import Navigation from './navigation';
import Dash from './dash';
import Poly from './poly';

import Binder from './binder';
import tick from './tick';

export default class XElement extends HTMLElement {

    static poly = Poly;
    static navigation = Navigation;
    static observedProperties?: Array<string>;

    static define (name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }

    // static start: any = null;
    // static tasks: Array<any> = [];
    // static pending: any = null;
    // static task (task?: any) {
    //     if (task) this.tasks.push(task);
    //     else console.log('restared');

    //     if (this.pending) {
    //         // console.log('pending');
    //         // cancelAnimationFrame(this.pending);
    //         // this.start = null;
    //         // this.pending = null;
    //         return;
    //     }

    //     this.pending = requestAnimationFrame((time) => {
    //         while (this.tasks.length) {
    //             this.tasks.shift()();
    //             if ((performance.now() - time) > 100) {
    //                 this.pending = null;
    //                 return this.task();
    //             }
    //         }
    //         console.log('raf done');
    //         // this.start = null;
    //         this.pending = null;
    //     });

    // }

    get isPrepared () { return this.#prepared; }
    #renders: Array<any> = [];
    // #renders: Set<any> = new Set();

    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #prepared = false;
    #preparing = false;
    #syntaxMatch = new RegExp('{{.*?}}');
    #binders: Map<string | Node, Set<any>> = new Map();
    #mutator = new MutationObserver(this.#mutation.bind(this));

    // #data = {};
    // #context = new Proxy(this.#data, {
    #context = new Proxy({}, {
        get: ContextGet.bind(null, this.#change.bind(this), ''),
        set: ContextSet.bind(null, this.#change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this.#change.bind(this), '')
    });

    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #preparedEvent = new Event('prepared');
    #preparingEvent = new Event('preparing');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');

    constructor () {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe((this.shadowRoot as ShadowRoot), { childList: true });
    }

    prepare () {
        if (this.#prepared || this.#preparing) return;

        this.#preparing = true;
        this.dispatchEvent(this.#preparingEvent);

        const prototype = Object.getPrototypeOf(this);
        const properties = (this.constructor as any).observedProperties;
        const descriptors: any = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };

        for (const property in descriptors) {

            if (properties && !properties?.includes(property) ||
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'constructor' === property ||
                'prepare' === property ||
                'register' === property ||
                'release' === property
            ) continue;

            const descriptor = descriptors[ property ];

            if (!descriptor.configurable) continue;
            if (descriptor.set) descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);

            // Object.defineProperty(this.#data, property, descriptor);
            Object.defineProperty(this.#context, property, descriptor);

            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configureable,
                get: () => this.#context[ property ],
                set: (value) => this.#context[ property ] = value
            });

        }

        // let shadowNode = this.shadowRoot?.firstChild;
        // while (shadowNode) {
        //     const node = shadowNode;
        //     shadowNode = node.nextSibling;
        //     this.register(node, this.#context);
        // }
        // if (this.shadowRoot) this.register(this.shadowRoot, this.#context);

        // let innerNode = this.firstChild;
        // while (innerNode) {
        //     const node = innerNode;
        //     innerNode = node.nextSibling;
        //     this.register(node, this.#context);
        // }

        this.register(this, this.#context);
        for (const [ key, value ] of this.#binders) {
            if (typeof key == 'string') value.forEach(binder => binder.render());
        }

        // while (this.#renders.length) tick(this.#renders?.shift()?.render);

        this.#prepared = true;
        this.dispatchEvent(this.#preparedEvent);
    }

    #change (reference: string, type: string) {
        console.log('change', reference);

        const binders = this.#binders.get(reference);
        if (binders) {
            for (const binder of binders) {
                binder[ type ](binder);
            }
        }

        const start = `${reference}.`;
        for (const [ key, binders ] of this.#binders) {
            if ((key as string)?.startsWith?.(start)) {
                if (binders) {
                    for (const binder of binders) {
                        // binder[ type ](binder);
                        tick(() => binder[ type ](binder));
                    }
                }
            }
        }

    }

    #mutation (mutations: Array<MutationRecord>) {
        console.log('mutation', mutations);
        if (!this.#prepared) return this.prepare();
        // for (const mutation of mutations) {
        //     for (const node of mutation.addedNodes) {
        //         this.register(node, this.#context);
        //     }
        //     for (const node of mutation.removedNodes) {
        //         this.release(node);
        //     }
        // }
    }

    #remove (node: Node) {
        const binders = this.#binders.get(node);
        if (!binders) return;

        for (const binder of binders) {
            for (const reference of binder.references) {
                if (this.#binders.has(reference)) {
                    this.#binders.get(reference)?.delete(binder);
                    if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
                }
            }
        }

        this.#binders.delete(node);
    }

    #add (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {

        const binder = Binder(node, this, context, rewrites);
        // binder.render = () => (this.constructor as any).task(binder.handler.render.bind(binder, binder));
        // binder.reset = () => (this.constructor as any).task(binder.handler.reset.bind(binder, binder));

        for (const reference of binder.references) {
            // for (const reference of binder.cache.references) {

            // if (rewrites) {
            //     let rewrite = reference;
            //     for (const [ name, value ] of rewrites) {
            //         rewrite = rewrite === name ? value :
            //             rewrite.startsWith(name + '.') ? value + rewrite.slice(name.length) : rewrite;
            //     }
            //     // console.log(rewrite);
            //     binder.references.add(rewrite);
            //     if (this.#binders.has(rewrite)) {
            //         this.#binders.get(rewrite)?.add(binder);
            //     } else {
            //         this.#binders.set(rewrite, new Set([ binder ]));
            //     }
            // } else {
            // binder.references.add(reference);
            const binders = this.#binders.get(reference);
            if (binders) {
                binders.add(binder);
            } else {
                this.#binders.set(reference, new Set([ binder ]));
            }
            // }

        }

        const nodes = this.#binders.get(binder.owner ?? binder.node);
        if (nodes) {
            nodes.add(binder);
        } else {
            this.#binders.set(binder.owner ?? binder.node, new Set([ binder ]));
        }

        // return binder.render(binder);
        // return binder;
        // this.#renders.push(binder);
    }

    release (node: Node) {

        if (node.nodeType === Node.TEXT_NODE) {
            this.#remove(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.#remove(node);

            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                this.#remove(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.release(child);
                child = child.nextSibling;
            }

        }
    }

    async register (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {

            let child = node.firstChild;
            while (child) {
                this.register(child, context, rewrites);
                child = child.nextSibling;
            }

        } else if (node.nodeType === node.TEXT_NODE) {

            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;

            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                this.register(
                    (node as Text).splitText(end + this.#syntaxLength), context, rewrites);
                this.#add(node, context, rewrites);
            } else {
                this.#add(node, context, rewrites);
            }

        } else if (node.nodeType === node.ELEMENT_NODE) {

            let attribute;
            for (attribute of (node as Element).attributes) {
                if (this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, context, rewrites);
                }
            }

            let child = node.firstChild;
            while (child) {
                this.register(child, context, rewrites);
                child = child.nextSibling;
            }

        }
    }

    adoptedCallback () {
        this.dispatchEvent(this.#adoptingEvent);
        (this as any).adopted?.();
        this.dispatchEvent(this.#adoptedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(this.#connectingEvent);
        (this as any).connected?.();
        this.dispatchEvent(this.#connectedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(this.#disconnectingEvent);
        (this as any).disconnected?.();
        this.dispatchEvent(this.#disconnectedEvent);
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(this.#attributingEvent);
        (this as any).attributed?.(name, from, to);
        this.dispatchEvent(this.#attributedEvent);
    }

}
