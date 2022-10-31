import { ContextType, ItemType, ObservedProperties, RenderType } from './types.ts';
import Navigation from './navigation.ts';
import Context from './context.ts';

import { compile, patch, tree } from './virtual.ts';
import { dash, whitespace } from './tool.ts';

// const NAMES = new WeakMap();
const DEFINED = new WeakSet();
const CE = window.customElements;
Object.defineProperty(window, 'customElements', {
    get: () => ({
        define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
            if (constructor.prototype instanceof XElement && !DEFINED.has(constructor)) {
                constructor = new Proxy(constructor, {
                    construct(target, args, extender) {
                        const instance = Reflect.construct(target, args, extender);
                        instance.upgrade();
                        return instance;
                    },
                });

                DEFINED.add(constructor);
                // NAMES.set(constructor, name);
            }
            CE.define(name, constructor, options);
        },
        get: CE.get,
        whenDefined: CE.whenDefined,
    }),
});

class XElement extends HTMLElement {
    static observedProperties?: ObservedProperties;

    static navigation = Navigation;

    static slottedEvent = new Event('slotted');
    static slottingEvent = new Event('slotting');

    static adoptedEvent = new Event('adopted');
    static adoptingEvent = new Event('adopting');

    static updatedEvent = new Event('updated');
    static updatingEvent = new Event('updating');

    static upgradedEvent = new Event('upgraded');
    static upgradingEvent = new Event('upgrading');

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

    get isUpgraded() {
        return this.#upgraded;
    }

    #updating = false;

    #upgraded = false;
    #upgrading = false;

    #context: ContextType = Context({}, this.update.bind(this));

    #roots: any;
    #render?: RenderType;
    #sources?: any;
    #targets?: any;

    // get context() {
    //     return this.#context;
    // }

    constructor() {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.shadowRoot?.addEventListener('slotchange', this.slottedCallback.bind(this));
    }

    update() {
        if (this.#updating) return;

        this.#updating = true;
        this.dispatchEvent(XElement.updatingEvent);

        this.#targets = this.#render?.(this.#context);

        for (let i = 0; i < this.#roots.length; i++) {
            patch(this.#sources[i], this.#targets[i], this.#roots[i]);
        }

        this.#sources = this.#targets;

        this.#updating = false;
        this.dispatchEvent(XElement.updatedEvent);
    }

    upgrade() {
        // console.log('upgraded');
        if (this.#upgraded) return;
        if (this.#upgrading) return new Promise((resolve) => this.addEventListener('upgraded', () => resolve(undefined)));

        this.#upgrading = true;
        this.dispatchEvent(XElement.upgradingEvent);

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

        if (this.shadowRoot) {
            this.#roots = [];

            const parsed = [];
            const stringified = [];

            for (const node of this.shadowRoot.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue && whitespace.test(node.nodeValue)) {
                    this.shadowRoot.removeChild(node);
                } else {
                    const [s, p] = tree(node);
                    parsed.push(p);
                    stringified.push(s);
                    this.#roots.push(node);
                }
            }

            const slots = this.shadowRoot.querySelectorAll('slot');
            for (const slot of slots) {
                const nodes = slot.assignedNodes();
                for (const node of nodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.nodeValue && whitespace.test(node.nodeValue)) {
                        node?.parentNode?.removeChild(node);
                    } else {
                        const [s, p] = tree(node);
                        parsed.push(p);
                        stringified.push(s);
                        this.#roots.push(node);
                    }
                }
            }

            this.#sources = parsed;
            this.#render = compile(stringified);
            this.#targets = this.#render(this.#context);
            for (let i = 0; i < this.#roots.length; i++) {
                patch(this.#sources[i], this.#targets[i], this.#roots[i]);
            }
            this.#sources = this.#targets;
        }

        // for (const slot of slots) {
        //     if (slot.assignedNodes) {
        //         const nodes = slot.assignedNodes() ?? [];
        //         for (const node of nodes) {
        //             promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
        //         }
        //     } else {
        //         // linkdom work around
        //         const attribute = slot.attributes.getNamedItem('name');
        //         if (attribute) {
        //             const element = this.querySelector(`[slot="${attribute.value}"`);
        //             if (element) {
        //                 promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, element));
        //                 const nodes = element.childNodes;
        //                 for (const node of nodes) {
        //                     promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
        //                 }
        //             }
        //         } else {
        //             const nodes = this.childNodes;
        //             for (const node of nodes) {
        //                 promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
        //             }
        //         }
        //     }
        // }

        this.#upgraded = true;
        this.#upgrading = false;
        this.dispatchEvent(XElement.upgradedEvent);
    }

    async slottedCallback() {
        // console.log('slottedCallback');
        // this.upgrade();
        this.dispatchEvent(XElement.slottingEvent);
        await (this as any).slotted?.();
        this.dispatchEvent(XElement.slottedEvent);
    }

    async connectedCallback() {
        // console.log('connectedCallback');
        // this.upgrade();
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

export default XElement;

// export default new Proxy(XElement, {
//     construct(target, args, extender: any) {
//         // const name = NAMES.get(extender) || NAMES.get(target);
//         // CE.whenDefined(name).then((c) => {
//         //     console.log(Object.getOwnPropertyNames(instance));
//         // });

//         const instance = Reflect.construct(target, args, extender);
//         // customElements.whenDefined('o-loop').then((c) => console.log(c));
//         // console.log(Object.getOwnPropertyNames(instance));
//         // customElements.whenDefined(instance.localName).then(() => instance.upgrade());

//         return instance;
//     },
// });
