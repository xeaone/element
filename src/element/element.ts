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

export default class XElement extends HTMLElement {

    static data = () => ({});
    static attributes = () => [];
    static style: () => string | Element;
    static shadow: () => string | Element;

    static get observedAttributes () {
        return this.attributes();
    }

    static define (name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }

    // #setup = false;
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #syntaxMatch = new RegExp('{{.*?}}');
    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');
    #template = document.createElement('template');
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

    data: {} | [] = {};
    binders: Map<any, any> = new Map();

    constructor () {
        super();

        const style = (this.constructor as any).style?.();
        const data = (this.constructor as any).data?.();
        const shadow = (this.constructor as any).shadow?.();

        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' });
        }

        this.data = new Proxy(data, {
            get: dataGet.bind(null, dataEvent.bind(null, this.binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.binders), '')
        });

        if (typeof style === 'string') {
            this.#template.innerHTML = `<style>${style}</style>`;
            this.shadowRoot.prepend(this.#template.content);
        } else if (shadow instanceof Element) {
            this.shadowRoot.prepend(style);
        }

        if (typeof shadow === 'string') {
            this.#template.innerHTML = shadow;
            this.shadowRoot.append(this.#template.content);
        } else if (shadow instanceof Element) {
            this.shadowRoot.append(shadow);
        }

        let node = this.shadowRoot.firstChild;
        while (node) {
            this.binds(node);
            node = node.nextSibling;
        }

        if ((this.constructor as any).adopt) {
            this.shadowRoot.appendChild(document.createElement('slot'));
            let node = this.firstChild;
            while (node) {
                this.binds(node);
                node = node.nextSibling;
            }
        }

    }

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
        const type = name.startsWith('on') ? 'on' : name in this.#handlers ? name : 'standard';
        const handler = this.#handlers[ type ];
        const container = this;

        context = context ?? this.data;

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
        if (node.nodeType === TEXT) {

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
        // if (!this.#setup) this.#setup = true;
        (this as any).connected?.();
        this.dispatchEvent(this.#connectedEvent);
    }

}
