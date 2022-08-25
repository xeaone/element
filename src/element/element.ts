import { ContextDelete, ContextGet, ContextSet } from './context';
import Navigation from './navigation';
import Binder from './binder';
import Dash from './dash';
import Poly from './poly';

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
    #resets: Array<any> = [];
    #reseting: boolean = false;
    #rendering: boolean = false;

    #syntaxEnd: string = '}}';
    #syntaxStart: string = '{{';
    #syntaxLength: number = 2;
    #prepared: boolean = false;
    #preparing: boolean = false;
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

        this.register(this.shadowRoot as any, this.#context);
        this.register(this, this.#context);
        this.render();

        this.#prepared = true;
        this.dispatchEvent(this.#preparedEvent);
    }

    async reset () {
        console.log('element reset start');
        if (this.#reseting) return;
        else this.#reseting = true;
        await Promise.all(this.#resets.splice(0).map(async binder => binder.reset(binder)));
        this.#reseting = false;
        if (this.#resets.length) await this.reset();
        console.log('element reset end');
    }

    async render () {
        console.log('element render start');
        if (this.#rendering) return;
        else this.#rendering = true;
        await Promise.all(this.#renders.splice(0).map(async binder => binder.render(binder)));
        this.#rendering = false;
        if (this.#renders.length) await this.render();
        console.log('element render end');
    }

    #change (reference: string, type: string) {
        const tasks = type == 'render' ? this.#renders : this.#resets;
        const start = `${reference}.`;

        let key, binders;
        for ([ key, binders ] of this.#binders) {
            if ((key as string) == reference) {
                if (binders) {
                    let binder;
                    for (binder of binders) {
                        tasks.unshift(binder);
                    }
                }
            } else if ((key as string)?.startsWith?.(start)) {
                if (binders) {
                    let binder;
                    for (binder of binders) {
                        tasks.push(binder);
                    }
                }
            }
        }

        if (type == 'render') this.render();
        else if (type == 'reset') this.reset();
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

        let binder, reference;
        for (binder of binders) {
            for (reference of binder.references) {
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

        let reference, binders;
        for (reference of binder.references) {
            binders = this.#binders.get(reference);
            if (binders) {
                binders.add(binder);
            } else {
                this.#binders.set(reference, new Set([ binder ]));
            }
        }

        const nodes = this.#binders.get(binder.owner ?? binder.node);
        if (nodes) {
            nodes.add(binder);
        } else {
            this.#binders.set(binder.owner ?? binder.node, new Set([ binder ]));
        }

        this.#renders.push(binder);
    }

    release (node: Node) {
        if (node.nodeType == Node.TEXT_NODE) {
            this.#remove(node);
        } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {

            let child = node.firstChild;
            while (child) {
                this.release(child);
                child = child.nextSibling;
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.#remove(node);

            let attribute;
            for (attribute of (node as Element).attributes) {
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
        if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {

            let child = node.firstChild;
            while (child) {
                this.register(child, context, rewrites);
                child = child.nextSibling;
            }

        } else if (node.nodeType == node.TEXT_NODE) {

            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;

            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                this.register((node as Text).splitText(end + this.#syntaxLength), context, rewrites);
            }

            this.#add(node, context, rewrites);

        } else if (node.nodeType == node.ELEMENT_NODE) {

            let attribute, ignore;
            for (attribute of (node as Element).attributes) {
                if (attribute.name == 'x-ignore') ignore = true;
                if (this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, context, rewrites);
                }
            }

            if (ignore) return;

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
