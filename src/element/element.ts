import { ContextDelete, ContextGet, ContextSet } from './context';
import Navigation from './navigation';
import Binder from './binder';
import Dash from './dash';
import Poly from './poly';

export default class XElement extends HTMLElement {

    static poly = Poly;
    static navigation = Navigation;
    static syntaxLength: number = 2;
    static syntaxEnd: string = '}}';
    static syntaxStart: string = '{{';
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

    static define (name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }

    get isPrepared () { return this._prepared; }

    private _prepared: boolean = false;
    private _preparing: boolean = false;
    private _updates: Set<any> = new Set();
    private _binders: Map<string | Node, Set<any>> = new Map();
    private _mutator = new MutationObserver(this._mutation.bind(this));

    // _data = {};
    // _context = new Proxy(this._data, {
    private _context = new Proxy({}, {
        get: ContextGet.bind(null, this._change.bind(this), ''),
        set: ContextSet.bind(null, this._change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this._change.bind(this), '')
    });

    constructor () {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this._mutator.observe(this, { childList: true });
        this._mutator.observe((this.shadowRoot as ShadowRoot), { childList: true });
    }

    _change (reference: string, type: string) {
        const start = `${reference}.`;

        let key, binders, binder;
        for ([ key, binders ] of this._binders) {
            if ((key as string) == reference) {
                if (binders) {
                    for (binder of binders) {
                        binder.mode = type;
                        this._updates.add(binder);
                    }
                }
            } else if ((key as string)?.startsWith?.(start)) {
                if (binders) {
                    for (binder of binders) {
                        binder.mode = type;
                        this._updates.add(binder);
                    }
                }
            }
        }

        this.update();
    }

    _mutation (mutations: Array<MutationRecord>) {
        this.prepare();
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                this.register(node, this._context);
            }
            for (const node of mutation.removedNodes) {
                this.release(node);
            }
        }
    }

    _remove (node: Node) {
        const binders = this._binders.get(node);
        if (!binders) return;

        let binder, reference;
        for (binder of binders) {
            for (reference of binder.references) {
                if (this._binders.has(reference)) {
                    this._binders.get(reference)?.delete(binder);
                    if (!this._binders.get(reference)?.size) this._binders.delete(reference);
                }
            }
        }

        this._binders.delete(node);
    }

    _add (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {
        const binder = Binder(node, this, context, rewrites);

        let binders, reference;
        for (reference of binder.references) {
            binders = this._binders.get(reference);
            if (binders) {
                binders.add(binder);
            } else {
                this._binders.set(reference, new Set([ binder ]));
            }
        }

        const nodes = this._binders.get(binder.owner ?? binder.node);
        if (nodes) {
            nodes.add(binder);
        } else {
            this._binders.set(binder.owner ?? binder.node, new Set([ binder ]));
        }

        // binder.render(binder);
        binder.mode = 'render';
        this._updates.add(binder);
    }

    async prepare () {
        if (this._prepared || this._preparing) return;

        this._preparing = true;
        this.dispatchEvent(XElement.preparingEvent);

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
                property.startsWith('_')
            ) continue;

            const descriptor = descriptors[ property ];

            if (!descriptor.configurable) continue;
            if (descriptor.set) descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);

            // Object.defineProperty(this._data, property, descriptor);
            Object.defineProperty(this._context, property, descriptor);

            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configureable,
                get: () => this._context[ property ],
                set: (value) => this._context[ property ] = value
            });

        }

        this.register(this.shadowRoot as any, this._context);
        this.register(this, this._context);
        await this.update();

        this._prepared = true;
        this.dispatchEvent(XElement.preparedEvent);
    }

    async update () {
        // const count = this._updates.size;
        // console.log('element update start', count);
        // if (this._rendering) return;
        // else this._rendering = true;
        // this.dispatchEvent(this._renderingEvent);

        const tasks = [];
        const updates = this._updates.values();
        let result = updates.next();
        while (!result.done) {
            this._updates.delete(result.value);
            tasks.push((async function (binder) { return binder[ binder.mode ](binder); })(result.value));
            result = updates.next();
        }

        // await Promise.all(updates.map(async binder => binder.render(binder)));
        // this.dispatchEvent(this._renderedEvent);
        // this._rendering = false;
        // if (this._renders.length) await this.render();
        await Promise.all(tasks);
        // console.log('element update end', count);
    }

    release (node: Node) {
        if (node.nodeType == Node.TEXT_NODE) {
            this._remove(node);
        } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {

            let child = node.firstChild;
            while (child) {
                this.release(child);
                child = child.nextSibling;
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this._remove(node);

            let attribute;
            for (attribute of (node as Element).attributes) {
                this._remove(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.release(child);
                child = child.nextSibling;
            }

        }
    }

    register (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) {
        if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {

            let child = node.firstChild;
            while (child) {
                this.register(child, context, rewrites);
                child = child.nextSibling;
            }

        } else if (node.nodeType == node.TEXT_NODE) {

            const start = node.nodeValue?.indexOf(XElement.syntaxStart) ?? -1;
            if (start == -1) return;
            if (start != 0) node = (node as Text).splitText(start);
            // console.log(start != 0, 'start');

            const end = node.nodeValue?.indexOf(XElement.syntaxEnd) ?? -1;
            if (end == -1) return;
            // console.log(end == -1, 'end');

            if (end + XElement.syntaxLength != node.nodeValue?.length) {
                this.register((node as Text).splitText(end + XElement.syntaxLength), context, rewrites);
            }

            this._add(node, context, rewrites);

        } else if (node.nodeType == node.ELEMENT_NODE) {
            let attribute;

            attribute = ((node as Element).attributes as any).each;
            if (attribute && XElement.syntaxMatch.test(attribute.value)) {
                return this._add(attribute, context, rewrites);
            }

            for (attribute of (node as Element).attributes) {
                if (XElement.syntaxMatch.test(attribute.value)) {
                    this._add(attribute, context, rewrites);
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
        this.dispatchEvent(XElement.adoptingEvent);
        (this as any).adopted?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(XElement.connectingEvent);
        (this as any).connected?.();
        this.dispatchEvent(XElement.connectedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(XElement.disconnectingEvent);
        (this as any).disconnected?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(XElement.attributingEvent);
        (this as any).attributed?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }

}
