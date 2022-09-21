import { ContextDelete, ContextGet, ContextSet } from './context.ts';
import Navigation from './navigation.ts';
import Binder from './binder.ts';
import { dash } from './tool.ts';

export default class XElement extends HTMLElement {
    static navigation = Navigation;
    static syntaxLength = 2;
    static syntaxEnd = '}}';
    static syntaxStart = '{{';
    static syntaxMatch = new RegExp('{{.*?}}');
    static observedProperties?: Array<string>;
    static adoptedEvent = new Event('adopted');
    static adoptingEvent = new Event('adopting');
    static preparedEvent = new Event('prepared');
    static preparingEvent = new Event('preparing');
    static connectedEvent = new Event('connected');
    static connectingEvent = new Event('connecting');
    static attributedEvent = new Event('attributed');
    static attributingEvent = new Event('attributing');
    static disconnectedEvent = new Event('disconnected');
    static disconnectingEvent = new Event('disconnecting');

    static define(name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }

    static defined(name: string) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }

    get isPrepared() {
        return this.#prepared;
    }

    #prepared = false;
    #preparing = false;
    #binders: Map<string | Node, Set<any>> = new Map();
    #mutator = new MutationObserver(this.#mutation.bind(this));

    adopted?: () => void;
    connected?: () => void;
    disconnected?: () => void;
    attributed?: (name: string, from: string, to: string) => void;

    // #data = {};
    // #context = new Proxy(this.#data, {
    #context = new Proxy({}, {
        get: ContextGet.bind(null, this.#change.bind(this), ''),
        set: ContextSet.bind(null, this.#change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this.#change.bind(this), ''),
    });

    constructor() {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe(this.shadowRoot as ShadowRoot, { childList: true });
    }

    async #change(reference: string, type: string) {
        const tasksFirst = [];
        const tasksSecond = [];

        let key, binder, binders;
        for ([key, binders] of this.#binders) {
            if (binders) {
                if ((key as string) == reference) {
                    for (binder of binders) tasksFirst.push(binder);
                } else if ((key as string)?.startsWith?.(`${reference}.`)) {
                    for (binder of binders) tasksSecond.push(binder);
                }
            }
        }

        await Promise.all(tasksFirst.map(async function changes(binder) {
            await binder[type](binder);
        }));

        await Promise.all(tasksSecond.map(async function changes(binder) {
            await binder[type](binder);
        }));
    }

    #mutation(mutations: Array<MutationRecord>) {
        if (this.#prepared) {
            let mutation, node;
            for (mutation of mutations) {
                for (node of mutation.addedNodes) {
                    this.register(node, this.#context, []);
                }
                for (node of mutation.removedNodes) {
                    this.release(node);
                }
            }
        } else {
            this.prepare();
        }
    }

    #remove(node: Node) {
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

    async #add(node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {
        const binder = Binder(node, this, context, rewrites);

        let binders, reference: any;
        for (reference of binder.references) {
            binders = this.#binders.get(reference);
            if (binders) {
                binders.add(binder);
            } else {
                this.#binders.set(reference, new Set([binder]));
            }
        }

        const nodes = this.#binders.get(binder.owner ?? binder.node);
        if (nodes) {
            nodes.add(binder);
        } else {
            this.#binders.set(binder.owner ?? binder.node, new Set([binder]));
        }

        await binder.render(binder);
    }

    // async update () {
    //     const tasks = [];
    //     const updates = this.#updates.values();

    //     let result = updates.next();
    //     while (!result.done) {
    //         this.#updates.delete(result.value);

    //         tasks.push(tick(async function updateTick (binder: any) {
    //             return binder[ binder.mode ](binder);
    //         }.bind(null, result.value)));

    //         // result.value[ result.value.mode ](result.value);
    //         // binder[ binder.mode ](binder);
    //         result = updates.next();
    //     }

    //     await Promise.all(tasks);

    //     if (this.#updates.size) await this.update();
    // }

    async prepare() {
        if (this.#prepared || this.#preparing) return;

        this.#preparing = true;
        this.dispatchEvent(XElement.preparingEvent);

        const prototype = Object.getPrototypeOf(this);
        const properties = XElement.observedProperties;
        const descriptors: any = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };

        for (const property in descriptors) {
            if (
                properties && !properties?.includes(property) ||
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'constructor' === property ||
                property.startsWith('#')
            ) {
                continue;
            }

            const descriptor = descriptors[property];

            if (!descriptor.configurable) continue;
            if (descriptor.set) descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);

            // Object.defineProperty(this.#data, property, descriptor);
            Object.defineProperty(this.#context, property, descriptor);

            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configureable,
                get: () => this.#context[property],
                set: (value) => this.#context[property] = value,
            });
        }

        await this.register(this.shadowRoot as ShadowRoot, this.#context);
        await this.register(this, this.#context);

        this.#prepared = true;
        this.dispatchEvent(XElement.preparedEvent);
    }

    async release(node: Node) {
        const tasks = [];

        if (node.nodeType == Node.TEXT_NODE) {
            tasks.push(this.#remove(node));
        } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while (child) {
                tasks.push(this.release(child));
                child = child.nextSibling;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            tasks.push(this.#remove(node));

            let attribute;
            for (attribute of (node as Element).attributes) {
                tasks.push(this.#remove(attribute));
            }

            let child = node.firstChild;
            while (child) {
                tasks.push(this.release(child));
                child = child.nextSibling;
            }
        }

        await Promise.all(tasks);
    }

    async register(node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {
        const tasks = [];

        if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while (child) {
                tasks.push(this.register(child, context, rewrites));
                child = child.nextSibling;
            }
        } else if (node.nodeType == node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf(XElement.syntaxStart) ?? -1;
            if (start == -1) return;
            if (start != 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(XElement.syntaxEnd) ?? -1;
            if (end == -1) return;

            if (end + XElement.syntaxLength != node.nodeValue?.length) {
                tasks.push(this.register((node as Text).splitText(end + XElement.syntaxLength), context, rewrites));
            }

            tasks.push(this.#add(node, context, rewrites));
        } else if (node.nodeType == node.ELEMENT_NODE) {
            let attribute;

            const html = ((node as Element).attributes as any).html;
            const each = ((node as Element).attributes as any).each;
            const inherit = ((node as Element).attributes as any).inherit;

            if (html) await this.#add(html, context, rewrites);
            if (each) await this.#add(each, context, rewrites);
            if (inherit) await this.#add(inherit, context, rewrites);

            for (attribute of (node as Element).attributes) {
                if (html === attribute) continue;
                if (each === attribute) continue;
                if (inherit === attribute) continue;
                if (XElement.syntaxMatch.test(attribute.value)) {
                    tasks.push(this.#add(attribute, context, rewrites));
                }
            }

            if (!html && !each && !inherit) {
                let child = node.firstChild;
                while (child) {
                    tasks.push(this.register(child, context, rewrites));
                    child = child.nextSibling;
                }
            }
        }

        await Promise.all(tasks);
    }

    adoptedCallback() {
        this.dispatchEvent(XElement.adoptingEvent);
        this.adopted?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }

    connectedCallback() {
        this.dispatchEvent(XElement.connectingEvent);
        this.connected?.();
        this.dispatchEvent(XElement.connectedEvent);
    }

    disconnectedCallback() {
        this.dispatchEvent(XElement.disconnectingEvent);
        this.disconnected?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }

    attributeChangedCallback(name: string, from: string, to: string) {
        this.dispatchEvent(XElement.attributingEvent);
        this.attributed?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }
}
