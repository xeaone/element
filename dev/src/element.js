import computer from './computer.js';
import standard from './standard.js';
// import literal from './literal.js';
import checked from './checked.js';
import parser from './parser.js';
import value from './value.js';
import each from './each.js';
import html from './html.js';
import text from './text.js';
import on from './on.js';

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
        event(reference, 'render');
        event(reference ? `${reference}.${key}` : `${key}`, 'render');
        return true;
    } else if (from === to) {
        return true;
    }

    Reflect.set(target, key, to, receiver);
    tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));

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
        // this.observer = new MutationObserver(this.mutationEvent.bind(this));
        // this.observer.observe(this, mutationOptions);
    }

    unbind (node) {
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

    bind (node) {
        const attribute = node.attributes.bind;

        node.x = node.x ?? {};
        node.x.alias = node.x.alias ?? {};
        node.x.node = node;
        node.x.container = this;
        node.x.scope = this.scope;

        const parsed = parser(attribute.value, node.x.rewrites);

        // const properties = literal(attribute.value);
        // for (const property of properties) {

        for (const { name, value, references } of parsed) {
            const binder = {};

            // binder.name = property.key;
            // binder.value = property.value;
            // binder.references = parser(property.value, node.x.rewrites);
            // binder.compute = computer(property.value, node.x.scope, node.x.alias);
            // binder.type = property.key.startsWith('on') ? 'on' : property.key in handlers ? property.key : 'standard';

            binder.node = node;
            binder.name = name;
            binder.value = value;
            binder.alias = node.x.alias;
            binder.references = references;
            binder.rewrites = node.x.rewrites;
            binder.container = node.x.container;
            binder.compute = computer(value, node.x.scope, node.x.alias);
            binder.type = name.startsWith('on') ? 'on' : name in handlers ? name : 'standard';
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

    mutationEvent (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                this.unbind(node);
            }
            for (const node of mutation.addedNodes) {
                this.bind(node);
            }
        }
    }

    scopeEvent (reference, type) {
        const binders = this.binders.get(reference);
        if (binders) {
            for (const binder of binders) {
                binder[ type ]();
            }
        }
    }

    walk (parent, method) {
        let child = parent?.firstElementChild;
        while (child) {
            if (!child.attributes?.bind?.value?.includes('each:')) this.walk(child, method);
            if (child.attributes?.bind) method(child);
            child = child.nextElementSibling;
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

        let render;
        if (this.render) render = await this.render();
        this.template.innerHTML = render;
        this.appendChild(this.template.content);

        this.walk(this, this.bind.bind(this));
    }

}