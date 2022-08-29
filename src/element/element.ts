import { ContextDelete, ContextGet, ContextSet } from './context';
import Navigation from './navigation';
import Binder from './binder';
import Dash from './dash';
import Poly from './poly';
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

    get isPrepared () { return this._prepared; }

    private _renders: Array<any> = [];
    private _resets: Array<any> = [];
    // private _reseting: boolean = false;
    // private _rendering: boolean = false;

    private _syntaxEnd: string = '}}';
    private _syntaxStart: string = '{{';
    private _syntaxLength: number = 2;
    private _prepared: boolean = false;
    private _preparing: boolean = false;
    private _syntaxMatch = new RegExp('{{.*?}}');
    private _binders: Map<string | Node, Set<any>> = new Map();
    private _mutator = new MutationObserver(this._mutation.bind(this));

    // _data = {};
    // _context = new Proxy(this._data, {
    private _context = new Proxy({}, {
        get: ContextGet.bind(null, this._change.bind(this), ''),
        set: ContextSet.bind(null, this._change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this._change.bind(this), '')
    });

    private _adoptedEvent = new Event('adopted');
    private _adoptingEvent = new Event('adopting');

    // private _resettedEvent = new Event('resetted');
    // private _resetingEvent = new Event('reseting');

    // private _renderedEvent = new Event('rendered');
    // private _renderingEvent = new Event('rendering');

    private _preparedEvent = new Event('prepared');
    private _preparingEvent = new Event('preparing');

    private _connectedEvent = new Event('connected');
    private _connectingEvent = new Event('connecting');

    private _attributedEvent = new Event('attributed');
    private _attributingEvent = new Event('attributing');

    private _disconnectedEvent = new Event('disconnected');
    private _disconnectingEvent = new Event('disconnecting');

    constructor () {
        super();

        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

        this._mutator.observe(this, { childList: true });
        this._mutator.observe((this.shadowRoot as ShadowRoot), { childList: true });

        // const self = this;
        // const prototype = Object.getPrototypeOf(this);
        // const descriptors = Object.getOwnPropertyDescriptors(prototype);
        // const connected = descriptors.connectedCallback;
        // XElement.prototype.connectedCallback.call(self);
        // connected.value = function (connected: any) { console.log(self); descriptors?.connectedCallback?.?.value(); };
        // const connectedCallback = this.connectedCallback;
        // console.log(connectedCallback);
        // this.connectedCallback = function () {
        // this.prepare();
        // XElement.prototype.connectedCallback();
        // connectedCallback?.call?.(this);
        // };
        // Object.defineProperty(this, 'connectedCallback', descriptors);
        // console.log(Object.getOwnPropertyDescriptors(this));
        // console.log(Object.getOwnPropertyDescriptors(prototype));
    }

    _change (reference: string, type: string) {
        // const tasks = type == 'render' ? this._renders : this._resets;
        const start = `${reference}.`;

        let key, binders;
        for ([ key, binders ] of this._binders) {
            if ((key as string) == reference) {
                if (binders) {
                    // let binder;
                    for (const binder of binders) {
                        tick(async () => binder.render(binder));
                        // tick((async function (b: any) { b.render(b); })(binder));
                        // tasks.unshift(binder);
                    }
                }
            } else if ((key as string)?.startsWith?.(start)) {
                if (binders) {
                    // let binder;
                    for (const binder of binders) {
                        tick(async () => binder.render(binder));
                        // binder.render(binder);
                        // tick(async function (binder: any) { binder.render(binder); }.bind(null, binder));
                        // tasks.push(binder);
                    }
                }
            }
        }

        // if (type == 'render') this.render();
        // else if (type == 'reset') this.reset();
    }

    _mutation (mutations: Array<MutationRecord>) {
        console.log('mutation', mutations);
        this._mutator.disconnect();
        this.prepare();
        // if (!this._prepared) return this.prepare();
        // for (const mutation of mutations) {
        //     for (const node of mutation.addedNodes) {
        //         this.register(node, this._context);
        //     }
        //     for (const node of mutation.removedNodes) {
        //         this.release(node);
        //     }
        // }
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

        // this._renders.push(binder);
        binder.render(binder);
    }

    // async prepare () {
    prepare () {
        if (this._prepared || this._preparing) return;

        this._preparing = true;
        this.dispatchEvent(this._preparingEvent);

        const prototype = Object.getPrototypeOf(this);
        const properties = (this.constructor as any).observedProperties;
        const descriptors: any = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };

        for (const property in descriptors) {

            // if (property == 'connectedCallback') {
            //     const descriptor = descriptors[ property ];
            //     console.log(descriptor);
            // }

            if (properties && !properties?.includes(property) ||
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'constructor' === property ||
                'register' === property ||
                'release' === property ||
                'prepare' === property ||
                'render' === property ||
                'reset' === property ||
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
        // await this.render();

        this._prepared = true;
        this.dispatchEvent(this._preparedEvent);
    }

    // async reset () {
    //     const length = this._renders.length;
    //     console.log('element reset start');
    //     // if (this._reseting) return;
    //     // else this._reseting = true;
    //     this.dispatchEvent(this._resetingEvent);
    //     await Promise.all(this._resets.splice(0).map(async binder => binder.reset(binder)));
    //     this.dispatchEvent(this._resettedEvent);
    //     // this._reseting = false;
    //     // if (this._resets.length) await this.reset();
    //     console.log('element reset end', length);
    // }

    // async render () {
    //     const length = this._renders.length;
    //     console.log('element render start', length);
    //     // if (this._rendering) return;
    //     // else this._rendering = true;
    //     this.dispatchEvent(this._renderingEvent);
    //     await Promise.all(this._renders.splice(0).map(async binder => binder.render(binder)));
    //     this.dispatchEvent(this._renderedEvent);
    //     // this._rendering = false;
    //     // if (this._renders.length) await this.render();
    //     console.log('element render end', length);
    // }

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

            const start = node.nodeValue?.indexOf(this._syntaxStart) ?? -1;
            if (start == -1) return;
            if (start != 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(this._syntaxEnd) ?? -1;
            if (end == -1) return;

            if (end + this._syntaxLength != node.nodeValue?.length) {
                this.register((node as Text).splitText(end + this._syntaxLength), context, rewrites);
            }

            this._add(node, context, rewrites);

        } else if (node.nodeType == node.ELEMENT_NODE) {
            let attribute;

            attribute = ((node as Element).attributes as any).each;
            if (attribute && this._syntaxMatch.test(attribute.value)) {
                return this._add(attribute, context, rewrites);
            }

            for (attribute of (node as Element).attributes) {
                if (this._syntaxMatch.test(attribute.value)) {
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
        this.dispatchEvent(this._adoptingEvent);
        (this as any).adopted?.();
        this.dispatchEvent(this._adoptedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(this._connectingEvent);
        (this as any).connected?.();
        this.dispatchEvent(this._connectedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(this._disconnectingEvent);
        (this as any).disconnected?.();
        this.dispatchEvent(this._disconnectedEvent);
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(this._attributingEvent);
        (this as any).attributed?.(name, from, to);
        this.dispatchEvent(this._attributedEvent);
    }

}
