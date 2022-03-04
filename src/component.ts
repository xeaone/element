// import Observer from './observer';
// import Css from './css';

import standard from './binder/standard';
import checked from './binder/checked';
import inherit from './binder/inherit';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import computer from './computer';
import parser from './parser';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;

const tick = Promise.resolve();

const scopeGet = function (event, reference, target, key, receiver) {
    if (key === 'x') return { reference };
    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: scopeGet.bind(null, event, reference),
            set: scopeSet.bind(null, event, reference),
            deleteProperty: scopeDelete.bind(null, event, reference)
        });
    }

    return value;
};

const scopeDelete = function (event, reference, target, key) {

    if (target instanceof Array) {
        target.splice(key, 1);
    } else {
        Reflect.deleteProperty(target, key);
    }

    tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'derender'));

    return true;
};

const scopeSet = function (event, reference, target, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        tick.then(event.bind(null, reference, 'render'));
        tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return true;
    }

    Reflect.set(target, key, to, receiver);
    tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));

    return true;
};

const scopeEvent = function (data, reference, type) {
    const binders = data.get(reference);
    if (binders) {
        for (const binder of binders) {
            binder[ type ]();
        }
    }
};

const handlers = {
    on,
    text,
    html,
    each,
    value,
    checked,
    standard
};

const template = document.createElement('template');
template.innerHTML = `<style>:host{display:block;}</style><slot></slot>`;

export default class Component extends HTMLElement {

    static attributes: string[];
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #setup = false;

    prefix = 'o-';
    prefixEach = 'o-each';
    prefixValue = 'o-value';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    syntaxLength = 2;
    binders: Map<any, any> = new Map();
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    data;
    root;
    html;
    adopt;
    shadow;
    handlers = handlers;
    template = document.createElement('template');

    // adopted: () => void;
    // rendered: () => void;
    // connected: () => void;
    // disconnected: () => void;
    // attributed: (name: string, from: string, to: string) => void;

    // #adopted: () => void;
    // #rendered: () => void;
    // #connected: () => void;
    // #disconnected: () => void;
    // #attributed: (name: string, from: string, to: string) => void;

    // #afterRenderEvent = new Event('afterrender');
    // #beforeRenderEvent = new Event('beforerender');
    // #afterConnectedEvent = new Event('afterconnected');
    // #beforeConnectedEvent = new Event('beforeconnected');

    static adopt = true;
    static html = () => '';
    static data = () => ({});
    static shadow = () => '<style>:host{display:block;}</style><slot></slot>';

    constructor () {
        super();

        // this.#adopted = (this as any).adopted;
        // this.#rendered = (this as any).rendered;
        // this.#connected = (this as any).connected;
        // this.#attributed = (this as any).attributed;
        // this.#disconnected = (this as any).disconnected;

        let node;
        const adopt = (this.constructor as any)?.adopt;
        const data = (this.constructor as any)?.data?.();
        const html = (this.constructor as any)?.html?.();
        const shadow = (this.constructor as any)?.shadow?.();

        this.adopt = adopt;
        this.shadow = this.attachShadow({ mode: 'open' });

        this.data = new Proxy(data, {
            get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
            set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
            deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
        });

        if (typeof shadow === 'string') {
            this.shadow.innerHTML = shadow;
            node = this.shadow.firstChild;
        } else {
            node = shadow?.firstChild;
        }

        while (node) {
            this.binds(node);
            node = node.nextSibling;
        }

        if (adopt) {
            node = this.firstChild;
            while (node) {
                this.binds(node);
                node = node.nextSibling;
            }
        }

        if (typeof html === 'string') {
            this.html = document.createElement('template');
            this.html.innerHTML = html;
            this.html = this.html.content;
            node = this.html.firstChild;
        } else {
            node = html.firstChild;
        }

        if (adopt) {
            while (node) {
                this.binds(node);
                node = node.nextSibling;
            }
        }

    }

    // get (data: any) {
    //     if (typeof data === 'string') {
    //         return this.pathBinders.get(data);
    //     } else {
    //         return this.nodeBinders.get(data);
    //     }
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
        const type = name.startsWith('on') ? 'on' : name in this.handlers ? name : 'standard';
        const handler = this.handlers[ type ];
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

        if (node.nodeType === TN) {
            this.unbind(node);
        } else if (node.nodeType === EN) {
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

        if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                this.binds(split, context, rewrites);
            }

            this.bind(node, 'text', node.nodeValue, node, context, rewrites);

        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;

            const inherit = attributes[ 'inherit' ];
            if (inherit) this.bind(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);

            const each = attributes[ 'each' ];
            if (each) this.bind(each, each.name, each.value, each.ownerElement, context, rewrites);

            if (!each && !inherit) {
                let child = node.firstChild;
                if (child) {
                    do this.binds(child, context, rewrites);
                    while (child = child.nextSibling);
                }
            }

            if (attributes.length) {
                for (const attribute of attributes) {
                    if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.syntaxMatch.test(attribute.value)) {
                        this.bind(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    }
                }
            }

        }

    }

    // #render () {

    //     this.data = Observer(
    //         typeof this.data === 'function' ? this.data() : this.data,
    //         this.#observe.bind(this)
    //     );

    //     if (this.adopt) {
    //         let child = this.firstChild;
    //         while (child) {
    //             this.#binder.add(child, this, this.data);
    //             child = child.nextSibling;
    //         }
    //     }

    //     const template = document.createElement('template');
    //     template.innerHTML = this.html;

    //     if (
    //         !this.shadow ||
    //         !('attachShadow' in document.body) &&
    //         !('createShadowRoot' in document.body)
    //     ) {
    //         const templateSlots = template.content.querySelectorAll('slot[name]');
    //         const defaultSlot = template.content.querySelector('slot:not([name])');

    //         for (let i = 0; i < templateSlots.length; i++) {
    //             const templateSlot = templateSlots[ i ];
    //             const name = templateSlot.getAttribute('name');
    //             const instanceSlot = this.querySelector('[slot="' + name + '"]');
    //             if (instanceSlot) templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
    //             else templateSlot.parentNode.removeChild(templateSlot);
    //         }

    //         if (this.children.length) {
    //             while (this.firstChild) {
    //                 if (defaultSlot) defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
    //                 else this.removeChild(this.firstChild);
    //             }
    //         }

    //         if (defaultSlot) defaultSlot.parentNode.removeChild(defaultSlot);
    //     }

    //     let child = template.content.firstChild;
    //     while (child) {
    //         this.#binder.add(child, this, this.data);
    //         child = child.nextSibling;
    //     }

    //     this.#root.appendChild(template.content);
    // }

    // attributeChangedCallback (name: string, from: string, to: string) {
    //     this.#attributed(name, from, to);
    // }

    // adoptedCallback () {
    //     if (this.#adopted) this.#adopted();
    // }

    // disconnectedCallback () {
    //     if (this.#disconnected) this.#disconnected();
    // }

    connectedCallback () {
        if (this.#setup) return;
        else this.#setup = true;

        if (this.html) {
            this.appendChild(this.html);
            this.html = this;
        }

        //     let data;
        //     if (this.data) data = this.data;
        //     // if (this.data) data = this.data();

        //     let render;
        //     if (this.html) render = this.html;
        //     console.log(this.html);

        //     // if (this.render) render = this.render();

        //     if (data instanceof Promise || render instanceof Promise) {
        //         return Promise.all([ data, render ]).then(function connectedCallbackPromise ([ data, render ]) {
        //             this.data = new Proxy(data ?? {}, {
        //                 get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
        //                 set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
        //                 deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
        //             });

        //             if (render) this.template.innerHTML = render;

        //             let adoptNode = this.firstChild;
        //             while (adoptNode) {
        //                 this.binds(adoptNode);
        //                 adoptNode = adoptNode.nextSibling;
        //             }

        //             let templateNode = this.template.content.firstChild;
        //             while (templateNode) {
        //                 this.binds(templateNode);
        //                 templateNode = templateNode.nextSibling;
        //             }

        //             this.appendChild(this.template.content);
        //         });
        //     } else {
        //         this.data = new Proxy(data ?? {}, {
        //             get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
        //             set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
        //             deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
        //         });

        //         if (render) this.template.innerHTML = render;

        //         let adoptNode = this.firstChild;
        //         while (adoptNode) {
        //             this.binds(adoptNode);
        //             adoptNode = adoptNode.nextSibling;
        //         }

        //         let templateNode = this.template.content.firstChild;
        //         while (templateNode) {
        //             this.binds(templateNode);
        //             templateNode = templateNode.nextSibling;
        //         }

        //         this.appendChild(this.template.content);
        //     }

        //     // if (!this.#flag) {
        //     //     this.#flag = true;
        //     //     this.dispatchEvent(this.#beforeRenderEvent);
        //     //     this.#render();
        //     //     if (this.#rendered) this.#rendered();
        //     //     this.dispatchEvent(this.#afterRenderEvent);
        //     //     this.#ready = true;
        //     //     this.dispatchEvent(this.#readyEvent);
        //     // }

        //     // this.dispatchEvent(this.#beforeConnectedEvent);
        //     // if (this.#connected) this.#connected();
        //     // this.dispatchEvent(this.#afterConnectedEvent);
    }

}
