import { dataDelete, dataEvent, dataGet, dataSet } from './data';
import standard from './standard';
import checked from './checked';
import inherit from './inherit';
import value from './value';
import each from './each';
import html from './html';
import text from './text';
import on from './on';

import computer from './computer';
import parser from './parser';
import dash from './dash';
import tick from './tick';

const TEXT = Node.TEXT_NODE;
const ELEMENT = Node.ELEMENT_NODE;
const FRAGMENT = Node.DOCUMENT_FRAGMENT_NODE;

// declarative shadow root polyfill
if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
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

// const setInnerHTML = function (data: string) {
//     this.observeProperties();

//     let node;

//     while (node = this.shadowRoot.firstChild) {
//         this.unbinds(node);
//         Element.prototype.removeChild.call(this.shadowRoot, node);
//     }

//     if (!this._template) {
//         this._template = document.createElement('template');
//     }

//     this._template.innerHTML = data;
//     node = this._template.content.firstChild;

//     while (node) {
//         this.binds(node);
//         node = node.nextSibling;
//     }

//     Element.prototype.appendChild.call(this.shadowRoot, this._template.content);
// };

// const getInnerHTML = function () {
//     return [ ...this.childNodes ].map(child => child.nodeValue ?? child.outerHTML).join('');
// };

// const append = function (...nodes: Node[]) {
//     this.setup();
//     nodes.forEach(node => this.binds(node));
//     return Element.prototype.append(this.shadowRoot, ...nodes);
// };

// const prepend = function (...nodes: Node[]) {
//     this.setup();
//     nodes.forEach(node => this.binds(node));
//     return Element.prototype.prepend.call(this.shadowRoot, ...nodes);
// };

// const appendChild = function (node: Node) {
//     console.log(node.nodeType);
//     this.setup();
//     this.binds(node);
//     return Element.prototype.appendChild.call(this.shadowRoot, node);
// };

// const removeChild = function (node: Node) {
//     this.setup();
//     this.unbinds(node);
//     return Element.prototype.removeChild.call(this.shadowRoot, node);
// };

// const replaceChild = function (newChild: Node, oldChild: Node) {
//     this.setup();
//     this.binds(newChild);
//     this.unbinds(oldChild);
//     return Element.prototype.replaceChild.call(this.shadowRoot, newChild, oldChild);
// };

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

    static setup: boolean = true;
    static observedProperties: string[] = [];

    #mutator;
    #data: {} = {};
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #setup = false;
    #observed = false;
    #syntaxMatch = new RegExp('{{.*?}}');
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');
    // #template = document.createElement('template');
    // #mutator = new MutationObserver(this.#mutation);
    #handlers = {
        on,
        text,
        html,
        each,
        value,
        checked,
        inherit,
        standard
    };

    ready: () => void;
    binders: Map<any, any> = new Map();

    // set innerHTML (data: string) {
    //     this.observeProperties();

    //     let node;

    //     while (node = this.firstChild) {
    //         this.unbinds(node);
    //         Element.prototype.removeChild.call(this, node);
    //     }

    //     this.#template.innerHTML = data;
    //     node = this.#template.content.firstChild;

    //     while (node) {
    //         this.binds(node);
    //         node = node.nextSibling;
    //     }

    //     Element.prototype.appendChild.call(this, this.#template.content);
    // }

    // get innerHTML () {
    //     return [ ...this.childNodes ].map(child => child.nodeValue ?? (child as any).outerHTML).join('');
    // }

    constructor () {
        super();

        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        // Object.defineProperty(this.shadowRoot, 'append', { value: append.bind(this) });
        // Object.defineProperty(this.shadowRoot, 'prepend', { value: prepend.bind(this) });
        // Object.defineProperty(this.shadowRoot, 'appendChild', { value: appendChild.bind(this) });
        // Object.defineProperty(this.shadowRoot, 'removeChild', { value: removeChild.bind(this) });
        // Object.defineProperty(this.shadowRoot, 'replaceChild', { value: replaceChild.bind(this) });
        // Object.defineProperty(this.shadowRoot, 'innerHTML', { get: getInnerHTML, set: setInnerHTML.bind(this) });

        const setup = (this.constructor as any).setup;
        if (setup === true) tick(() => this.setup());
    }

    setup () {
        console.log('setup');
        if (this.#setup) return;
        else this.#setup = true;

        const data = {};
        const properties = (this.constructor as any).observedProperties;

        for (const property of properties) {
            data[ property ] = this[ property ];
            Object.defineProperty(this, property, {
                get () { return this.#data[ property ]; },
                set (value) { this.#data[ property ] = value; }
            });
        }

        this.#data = new Proxy(data, {
            get: dataGet.bind(null, dataEvent.bind(null, this.binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.binders), '')
        });

        let node;

        node = this.shadowRoot.firstChild;
        while (node) {
            this.binds(node);
            node = node.nextSibling;
        }

        node = this.firstChild;
        while (node) {
            this.binds(node);
            node = node.nextSibling;
        }

        this.#mutator = new MutationObserver(this.#mutation.bind(this));
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe(this.shadowRoot, { childList: true });

        if (this.ready) this.ready();
    }

    #mutation (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                this.unbinds(node);
            }
            for (const node of mutation.addedNodes) {
                this.binds(node);
            }
        }
    };

    // append (...nodes: Node[]) {
    //     this.setup();
    //     nodes.forEach(node => this.binds(node));
    //     return super.append.call(this, ...nodes);
    // }

    // prepend (...nodes: Node[]) {
    //     this.setup();
    //     nodes.forEach(node => this.binds(node));
    //     return Element.prototype.prepend.call(this, ...nodes);
    // }

    // appendChild (node: Node) {
    //     this.setup();
    //     this.binds(node);
    //     return super.appendChild.call(this, node);
    // }

    // removeChild (node: Node) {
    //     this.setup();
    //     this.unbinds(node);
    //     return super.removeChild.call(this, node);
    // }

    // replaceChild (newChild: Node, oldChild: Node) {
    //     this.setup();
    //     this.binds(newChild);
    //     this.unbinds(oldChild);
    //     return super.replaceChild.call(this, newChild, oldChild);
    // }

    unbind (node: Node) {
        const binders = this.binders.get(node);
        if (!binders) return;

        for (const binder of binders) {
            for (const reference of binder.references) {
                this.binders.get(reference)?.delete(binder);
                if (!this.binders.get(reference).size) this.binders.delete(reference);
            }
        }

        this.binders.delete(node);
    }

    bind (node: Node, name, value, owner, context?: any, rewrites?: any) {
        if (this.binders.has(node)) return console.log(node);

        const type = name.startsWith('on') ? 'on' : name in this.#handlers ? name : 'standard';
        const handler = this.#handlers[ type ];
        const container = this;

        // context = context ?? this;
        // context = context ?? this.data;
        context = context ?? this.#data;

        const binder = {
            meta: {},
            binder: this,
            render: undefined,
            compute: undefined,
            unrender: undefined,
            references: undefined,
            rewrites: rewrites ?? [],
            node, owner, name, value, context, container, type,
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
                    binder.references[ i ] = binder.references[ i ].replace(name, value);
                }
            }

            if (this.binders.has(binder.references[ i ])) {
                this.binders.get(binder.references[ i ]).add(binder);
            } else {
                this.binders.set(binder.references[ i ], new Set([ binder ]));
            }
        }

        if (this.binders.has(binder.owner)) {
            this.binders.get(binder.owner).add(binder);
        } else {
            this.binders.set(binder.owner, new Set([ binder ]));
        }

        binder.render();
    }

    unbinds (node: Node) {
        if (node.nodeType === TEXT) {
            this.unbind(node);
        } else if (node.nodeType === ELEMENT) {
            this.unbind(node);
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                this.unbind(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.unbinds(child);
                child = child.nextSibling;
            }

        }
    }

    binds (node: Node, context?: any, rewrites?: any) {
        if (node.nodeType === FRAGMENT) {
            node = node.firstChild;
            while (node) {
                this.binds(node, context, rewrites);
                node = node.nextSibling;
            }
        } else if (node.nodeType === TEXT) {

            const start = node.nodeValue.indexOf(this.#syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.#syntaxEnd);
            if (end === -1) return;

            if (end + this.#syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.#syntaxLength);
                this.binds(split, context, rewrites);
            }

            this.bind(node, 'text', node.nodeValue, node, context, rewrites);

        } else if (node.nodeType === ELEMENT) {
            const attributes = (node as Element).attributes;

            const inherit = attributes[ 'inherit' ];
            if (inherit) this.bind(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);

            const each = attributes[ 'each' ];
            if (each) this.bind(each, each.name, each.value, each.ownerElement, context, rewrites);

            if (!each && !inherit && !(node instanceof XElement)) {
                // console.log(this, node);
                let child = node.firstChild;
                while (child) {
                    this.binds(child, context, rewrites);
                    child = child.nextSibling;
                }
            }

            for (const attribute of attributes) {
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.bind(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                }
            }

        }
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(this.#attributingEvent);
        (this as any).attributed?.(name, from, to);
        this.dispatchEvent(this.#attributedEvent);
    }

    adoptedCallback () {
        this.dispatchEvent(this.#adoptingEvent);
        (this as any).adopted?.();
        this.dispatchEvent(this.#adoptedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(this.#disconnectingEvent);
        (this as any).disconnected?.();
        this.dispatchEvent(this.#disconnectedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(this.#connectingEvent);
        (this as any).connected?.();
        this.dispatchEvent(this.#connectedEvent);
    }

}
