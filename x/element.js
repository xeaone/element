import computer from './computer.js';
import standard from './standard.js';
import literal from './literal.js';
import checked from './checked.js';
import parser from './parser.js';
import value from './value.js';
import each from './each.js';
import html from './html.js';
import text from './text.js';
import on from './on.js';

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

    event(reference ? `${reference}.${key}` : `${key}`, 'derender');

    return true;
};

const scopeSet = function (event, reference, target, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        event(reference, 'render');
        event(reference ? `${reference}.${key}` : `${key}`, 'render');
        return true;
    } else if (from === to) {
        return true;
    }

    Reflect.set(target, key, to, receiver);
    event(reference ? `${reference}.${key}` : `${key}`, 'render');

    return true;
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

const mutationOptions = { attributes: false, childList: true, subtree: true };
const template = document.createElement('template');
template.innerHTML = `<style>:host{display:block;}</style><slot></slot>`;

export default class XElement extends HTMLElement {

    scope;
    shadow;
    setup = false;
    binders = new Map();
    template = document.createElement('template');

    constructor () {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.appendChild(template.content);
        this.observer = new MutationObserver(this.mutationEvent.bind(this));
        this.observer.observe(this, mutationOptions);
    }

    async unbind (node) {
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

    async bind (node) {

        const attribute = node?.attributes?.bind;
        if (!attribute || this.binders.has(node)) return;

        // if (node.localName.includes('-')) {
        //     await window.customElements.whenDefined(node.localName);
        // }

        if (!('x' in node)) node.x = {};
        node.x.node = node;
        node.x.container = this;
        node.x.scope = this.scope;

        const properties = literal(attribute.value);
        for (const property of properties) {
            const binder = {};

            binder.node = node;
            binder.container = this;
            binder.name = property.key;
            binder.alias = node.x.alias;
            binder.value = property.value;
            binder.rewrites = node.x.rewrites;
            binder.references = parser(property.value, node.x.rewrites);
            binder.compute = computer(property.value, node.x.scope, node.x.alias);
            binder.type = property.key.startsWith('on') ? 'on' : property.key in handlers ? property.key : 'standard';
            binder.render = handlers[ binder.type ].render.bind(null, binder);
            binder.derender = handlers[ binder.type ].derender.bind(null, binder);

            for (const reference of binder.references) {
                if (this.binders.has(reference)) {
                    this.binders.get(reference).add(binder);
                } else {
                    this.binders.set(reference, new Set([ binder ]));
                }
            }

            if (this.binders.has(node)) {
                this.binders.get(node).add(binder);
            } else {
                this.binders.set(node, new Set([ binder ]));
            }

            binder.render();
        }

    }

    async mutationEvent (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) this.unbind(node);
            for (const node of mutation.addedNodes) this.bind(node);
        }
    }

    async scopeEvent (reference, type) {
        const binders = this.binders.get(reference);
        if (binders) {
            for (const binder of binders) {
                binder[ type ]();
            }
        }
    }

    async walk (method, node) {
        let child = (node ?? this)?.firstChild;
        while (child) {
            method(child);
            if (!child?.attributes?.bind?.value?.includes('each:')) {
                this.walk(method, child);
            }
            child = child.nextSibling;
        }
    }

    async connectedCallback () {
        if (this.setup) return;
        else this.setup = true;

        let data = {};
        if (this.data) data = await this.data();

        this.scope = new Proxy(data, {
            get: scopeGet.bind(null, this.scopeEvent.bind(this), ''),
            set: scopeSet.bind(null, this.scopeEvent.bind(this), ''),
            deleteProperty: scopeDelete.bind(null, this.scopeEvent.bind(this), '')
        });

        // let render = `<style>:host{display:block;}</style><slot></slot>`;
        // if (this.render) render = await this.render();
        // this.template.innerHTML = render;
        // this.shadow.appendChild(this.template.content);

        let render;
        if (this.render) render = await this.render();
        this.template.innerHTML = render;
        this.appendChild(this.template.content);

        await this.walk(node => this.bind(node));

        // customElements.whenDefined(this.localName).then(() => this.walk(node => this.bind(node)));
    }

}