import { dataDelete, dataEvent, dataGet, dataSet } from './data.ts';
import standard from './standard.ts';
import checked from './checked.ts';
import inherit from './inherit.ts';
import value from './value.ts';
import each from './each.ts';
import html from './html.ts';
import text from './text.ts';
import on from './on.ts';

import computer from './computer.ts';
import parser from './parser.ts';
import dash from './dash.ts';
// import tick from './tick';

const TEXT = Node.TEXT_NODE;
const ELEMENT = Node.ELEMENT_NODE;
const FRAGMENT = Node.DOCUMENT_FRAGMENT_NODE;

// declarative shadow root polyfill
if ('shadowRoot' in HTMLTemplateElement.prototype === false) {
    (function attachShadowRoots (root) {
        const templates = root.querySelectorAll('template[shadowroot]');
        for (const template of templates) {
            const mode = template.getAttribute("shadowroot");
            const shadowRoot = (template.parentNode as any).attachShadow({ mode });
            shadowRoot.appendChild((template as any).content);
            template.remove();
            attachShadowRoots(shadowRoot);
        }
    })(document);
}

type Binder = {
    meta: any;
    container: any;
    render?: any;
    compute?: any;
    unrender?: any;
    references?: string[];
    binders: Map<any, any>;
    rewrites: string[];
    context: any;
    adds: any;
    removes: any;
    node: any;
    owner: any;
    name: string;
    value: string;
    type: string;
};

type Handler = {
    render: (binder: Binder) => void;
    unrender: (binder: Binder) => void;
};

export default class XElement extends HTMLElement {

    static define (name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }

    static observedProperties: string[] = [];

    #mutator;
    #data = {};
    #setup = false;
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #binders: Map<string | Node, any> = new Map();
    #syntaxMatch = new RegExp('{{.*?}}');
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');

    #handlers: Record<string, Handler> = {
        on,
        text,
        html,
        each,
        value,
        checked,
        inherit,
        standard
    };

    ready?: () => void;
    adopted?: () => void;
    connected?: () => void;
    attributed?: () => void;
    disconnected?: () => void;

    constructor () {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.#mutator = new MutationObserver(this.#mutation.bind(this));
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe((this.shadowRoot as ShadowRoot), { childList: true });
    }

    setup () {
        if (this.#setup) return;
        else this.#setup = true;

        const data: Record<any, any> = {};
        const properties = (this.constructor as any).observedProperties;

        for (const property of properties) {
            // const value = this[ property ];
            // if (typeof value === 'function') {
            //     data[ property ] = value.bind(this);
            // } else {
            //     data[ property ] = value;
            // }
            // data[ property ] = (this as any)[ property ];
            // Object.defineProperty(this, property, {
            //     get () { return this.#data[ property ]; },
            //     set (value) { this.#data[ property ] = value; }
            // });

            const value = (this as any)[ property ];
            if (typeof value === 'function') {
                data[ property ] = value.bind(this);
            } else {
                data[ property ] = value;
            }
            Object.defineProperty(this, property, {
                get () { return this.#data[ property ]; },
                set (value) { this.#data[ property ] = value; }
            });
        }

        this.#data = new Proxy(data, {
            get: dataGet.bind(null, dataEvent.bind(null, this.#binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.#binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.#binders), '')
        });

        let node;

        node = this.shadowRoot?.firstChild;
        while (node) {
            this.#adds(node);
            node = node.nextSibling;
        }

        node = this.firstChild;
        while (node) {
            this.#adds(node);
            node = node.nextSibling;
        }

        // this.#mutator = new MutationObserver(this.#mutation.bind(this));
        // this.#mutator.observe(this, { childList: true });
        // this.#mutator.observe(this.shadowRoot, { childList: true });

        if (this.ready) (this as any).ready();
    }

    #mutation (mutations: Array<MutationRecord>) {
        if (!this.#setup) return this.setup();
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                this.#adds(node);
            }
            for (const node of mutation.removedNodes) {
                this.#removes(node);
            }
        }
    }

    #remove (node: Node) {
        const binders = this.#binders.get(node);
        if (!binders) return;

        for (const binder of binders) {
            for (const reference of binder.references) {
                this.#binders.get(reference)?.delete(binder);
                if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
            }
        }

        this.#binders.delete(node);
    }

    #add (node: Node, name: string, value: string, owner: Node | Element | null, context?: any, rewrites?: any) {
        if (this.#binders.has(node)) return console.warn(node);

        const type: string = name.startsWith('on') ? 'on' : name in this.#handlers ? name : 'standard';
        const handler = this.#handlers[ type ];

        const binder: Binder = {
            meta: {},
            container: this,
            // render: undefined,
            // compute: undefined,
            // unrender: undefined,
            // references: [],
            binders: this.#binders,
            rewrites: rewrites ?? [],
            context: context ?? this.#data,
            adds: this.#adds.bind(this),
            removes: this.#removes.bind(this),
            node, owner, name, value, type,
        };

        const references = parser(value);
        const compute = computer(binder);

        binder.compute = compute;
        binder.references = [ ...references ];
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);

        for (let i = 0; i < binder.references.length; i++) {

            if (rewrites) {
                for (const [ name, value ] of rewrites) {
                    // might need to improve the name boundary
                    binder.references[ i ] = binder.references[ i ].replace(name, value);
                }
            }

            if (this.#binders.has(binder.references[ i ])) {
                this.#binders.get(binder.references[ i ]).add(binder);
            } else {
                this.#binders.set(binder.references[ i ], new Set([ binder ]));
            }
        }

        if (this.#binders.has(binder.owner)) {
            this.#binders.get(binder.owner).add(binder);
        } else {
            this.#binders.set(binder.owner, new Set([ binder ]));
        }

        binder.render();
    }

    #removes (node: Node) {
        if (node.nodeType === TEXT) {
            this.#remove(node);
        } else if (node.nodeType === ELEMENT) {
            this.#remove(node);
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                this.#remove(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.#removes(child);
                child = child.nextSibling;
            }

        }
    }

    #adds (node: Node, context?: any, rewrites?: any) {
        // if (node === null) {
        //     return;
        // } else
        if (node.nodeType === FRAGMENT) {
            node = node.firstChild as Node;
            while (node) {
                this.#adds(node, context, rewrites);
                node = node.nextSibling as Node;
            }
        } else if (node.nodeType === TEXT) {

            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;

            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                const split = (node as Text).splitText(end + this.#syntaxLength);
                this.#adds(split, context, rewrites);
            }

            this.#add(node, 'text', node.nodeValue ?? '', node, context, rewrites);

        } else if (node.nodeType === ELEMENT) {

            const inherit = ((node as Element).attributes as any)[ 'inherit' ];
            if (inherit) this.#add(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);

            const each = ((node as Element).attributes as any)[ 'each' ];
            if (each) this.#add(each, each.name, each.value, each.ownerElement, context, rewrites);

            // if (!each && !inherit && !(node instanceof XElement)) {
            if (!each && !inherit) {
                let child = node.firstChild;
                while (child) {
                    this.#adds(child, context, rewrites);
                    child = child.nextSibling;
                }
            }

            const attributes = [ ...(node as Element).attributes ];
            for (const attribute of attributes) {
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                }
            }

        }
    }

    adoptedCallback () {
        this.dispatchEvent(this.#adoptingEvent);
        if ((this as any).adopted) (this as any).adopted();
        this.dispatchEvent(this.#adoptedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(this.#connectingEvent);
        if ((this as any).connected) (this as any).connected();
        this.dispatchEvent(this.#connectedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(this.#disconnectingEvent);
        if ((this as any).disconnected) (this as any).disconnected();
        this.dispatchEvent(this.#disconnectedEvent);
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(this.#attributingEvent);
        if ((this as any).attributed) (this as any).attributed(name, from, to);
        this.dispatchEvent(this.#attributedEvent);
    }

}
