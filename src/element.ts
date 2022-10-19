import { BindersType, ContextType, NodesType, ObservedProperties, RewritesType } from './types.ts';
import { BinderAdd } from './binder.ts';
import Navigation from './navigation.ts';
import Context from './context.ts';
import { dash } from './tool.ts';

// const DEFINED = new WeakSet();
// const CE = window.customElements;
// Object.defineProperty(window, 'customElements', {
//     get: () => ({
//         define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
//             if (constructor.prototype instanceof XElement && !DEFINED.has(constructor)) {
//                 DEFINED.add(constructor);
//                 Object.defineProperties(constructor.prototype, {
//                     connected: { value: constructor.prototype.connectedCallback },
//                     connectedCallback: { value: XElement.prototype.connectedCallback },
//                 });
//             }
//             CE.define(name, constructor, options);
//         },
//         get: CE.get,
//         whenDefined: CE.whenDefined,
//     }),
// });

export default class XElement extends HTMLElement {
    static observedProperties?: ObservedProperties;

    static navigation = Navigation;
    static slottedEvent = new Event('slotted');
    static slottingEvent = new Event('slotting');
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
    #rewrites: RewritesType = [];
    #nodes: NodesType = new Map();
    #binders: BindersType = new Map();
    #context: ContextType = Context({}, this.#binders);
    // #context = Context({}, this.#binders, '', undefined);
    // #context: any = {};

    get b() {
        return this.#binders;
    }

    get c() {
        return this.#context;
    }

    constructor() {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.shadowRoot?.addEventListener('slotchange', this.slottedCallback.bind(this));
    }

    // async #change(reference: string, type: string) {
    //     const parents = [];
    //     const children = [];

    //     let key, binder, binders;

    //     for ([key, binders] of this.#binders) {
    //         if (binders) {
    //             if ((key as string) === reference) {
    //                 for (binder of binders) {
    //                     parents.push(binder);
    //                 }
    //             } else if ((key as string)?.startsWith?.(`${reference}.`)) {
    //                 for (binder of binders) {
    //                     children.push(binder);
    //                 }
    //             }
    //         }
    //     }

    //     await Promise.all(parents.map(async (binder) => await binder[type]?.(binder)));
    //     await Promise.all(children.map(async (binder) => await binder[type]?.(binder)));
    // }

    // #remove(node: Node) {
    //     const binders = this.#binders.get(node);
    //     if (!binders) return;

    //     let binder, reference;
    //     for (binder of binders) {
    //         for (reference of binder.references) {
    //             if (this.#binders.has(reference)) {
    //                 binder.reset = undefined;
    //                 binder.render = undefined;
    //                 this.#binders.get(reference)?.delete(binder);
    //                 if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
    //             }
    //         }
    //     }

    //     this.#binders.delete(node);
    // }

    async prepare() {
        if (this.#prepared) return;
        if (this.#preparing) return new Promise((resolve) => this.addEventListener('prepared', () => resolve(undefined)));

        this.#preparing = true;
        this.dispatchEvent(XElement.preparingEvent);

        const prototype = Object.getPrototypeOf(this);
        const descriptors: Record<string, PropertyDescriptor> = {};
        const properties: ObservedProperties = (this.constructor as any).observedProperties;

        if (properties) {
            properties.forEach((property) => descriptors[property] = Object.getOwnPropertyDescriptor(this, property) ?? {});
        } else {
            Object.assign(descriptors, Object.getOwnPropertyDescriptors(this));
            Object.assign(descriptors, Object.getOwnPropertyDescriptors(prototype));
        }

        for (const property in descriptors) {
            if (
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'slottedCallback' === property ||
                'disconnected' === property ||
                'constructor' === property ||
                'attributed' === property ||
                'connected' === property ||
                'adopted' === property ||
                'slotted' === property ||
                property.startsWith('#')
            ) continue;

            const descriptor = descriptors[property];

            if (!descriptor.configurable) continue;
            if (descriptor.set) descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);

            Object.defineProperty(this.#context, property, descriptor);

            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable,
                get: () => this.#context[property],
                set: (value) => this.#context[property] = value,
            });
        }

        const promises = [];

        let child = this.shadowRoot?.firstChild;
        while (child) {
            promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, child));
            child = child.nextSibling;
        }

        const slots = this.shadowRoot?.querySelectorAll('slot') ?? [];
        for (const slot of slots) {
            if (slot.assignedNodes) {
                const nodes = slot.assignedNodes() ?? [];
                for (const node of nodes) {
                    promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
                }
            } else {
                // linkdom work around
                const attribute = slot.attributes.getNamedItem('name');
                if (attribute) {
                    const element = this.querySelector(`[slot="${attribute.value}"`);
                    if (element) {
                        promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, element));
                        const nodes = element.childNodes;
                        for (const node of nodes) {
                            promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
                        }
                    }
                } else {
                    const nodes = this.childNodes;
                    for (const node of nodes) {
                        promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
                    }
                }
            }
        }

        await Promise.all(promises);

        this.#prepared = true;
        this.#preparing = false;
        this.dispatchEvent(XElement.preparedEvent);
    }

    async bind() {
    }

    async unbind() {
    }

    // async release(node: Node) {
    //     const tasks = [];

    //     if (node.nodeType == Node.TEXT_NODE) {
    //         tasks.push(this.#remove(node));
    //     } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
    //         let child = node.firstChild;
    //         while (child) {
    //             tasks.push(this.release(child));
    //             child = child.nextSibling;
    //         }
    //     } else if (node.nodeType === Node.ELEMENT_NODE) {
    //         tasks.push(this.#remove(node));

    //         let attribute;
    //         for (attribute of (node as Element).attributes) {
    //             tasks.push(this.#remove(attribute));
    //         }

    //         let child = node.firstChild;
    //         while (child) {
    //             tasks.push(this.release(child));
    //             child = child.nextSibling;
    //         }
    //     }

    //     await Promise.all(tasks);
    // }

    async slottedCallback() {
        console.log('slottedCallback');
        // await this.prepare();
        this.dispatchEvent(XElement.slottingEvent);
        await (this as any).slotted?.();
        this.dispatchEvent(XElement.slottedEvent);
    }

    async connectedCallback() {
        console.log('connectedCallback');
        await this.prepare();
        this.dispatchEvent(XElement.connectingEvent);
        await (this as any).connected?.();
        this.dispatchEvent(XElement.connectedEvent);
    }

    async disconnectedCallback() {
        this.dispatchEvent(XElement.disconnectingEvent);
        await (this as any).disconnected?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }

    async adoptedCallback() {
        this.dispatchEvent(XElement.adoptingEvent);
        await (this as any).adopted?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }

    async attributeChangedCallback(name: string, from: string, to: string) {
        this.dispatchEvent(XElement.attributingEvent);
        await (this as any).attributed?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }
}
