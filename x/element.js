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

const get = function (task, path, target, key, receiver) {
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : `${key}`;
        return new Proxy(value, {
            get: get.bind(null, task, path),
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });
    } else {
        return value;
    }
};

const deleteProperty = function (task, path, target, key) {

    if (target instanceof Array) {
        target.splice(key, 1);
    } else {
        Reflect.deleteProperty(target, key);
    }

    task(path ? `${path}.${key}` : `${key}`, 'delete');

    return true;
};

const set = function (task, path, target, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        task(path, 'set');
        task(path ? `${path}.${key}` : `${key}`, 'set');
        return true;
    } else if (from === to) {
        return true;
    }

    Reflect.set(target, key, to, receiver);

    task(path ? `${path}.${key}` : `${key}`, 'set');

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

const template = document.createElement('template');
template.innerHTML = `<style>:host{display:block;}</style><slot></slot>`;

export default class XElement extends HTMLElement {

    #data;
    #shadow;
    #setup = false;
    #template = document.createElement('template');

    #binders = new Map();
    get binders () { return this.#binders; }

    constructor () {
        super();

        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#shadow.appendChild(template.content);

        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                // console.log(mutation);
                mutation.removedNodes.forEach(node => this.#unbind(node));
                mutation.addedNodes.forEach(node => this.#bind(node));
            });
        });

        this.observer.observe(this, { attributes: false, childList: true, subtree: true });
    }

    #task (path, type) {
        this.#binders.get(path)?.forEach(binder => binder.render());
    }

    #unbind (node) {
        const binder = this.#binders.get(node);
        if (!binder) return;

        binder.references.forEach(reference => {
            this.#binders.get(reference).remove(binder);
            if (!this.#binders.get(reference).size) {
                this.#binders.delete(reference);
            }
        });

        this.#binders.delete(node);
    }

    #bind (node) {

        const attribute = node?.attributes?.bind;
        if (!attribute || this.#binders.has(node)) return;

        // if (node.localName.includes('-')) {
        //     await window.customElements.whenDefined(node.localName);
        // }

        const properties = literal(attribute.value);
        for (const property of properties) {
            const { key: name, value } = property;

            const binder = {
                name, value, node,
                container: this,
                references: parser(value),
                compute: computer(value, this.#data),
                type: name.startsWith('on') ? 'on' : name in handlers ? name : 'standard',
            };

            binder.render = handlers[ binder.type ].render.bind(null, binder);
            binder.derender = handlers[ binder.type ].derender.bind(null, binder);

            for (const reference of binder.references) {
                if (this.#binders.has(reference)) {
                    this.#binders.get(reference).add(binder);
                } else {
                    this.#binders.set(reference, new Set([ binder ]));
                }
            }

            this.#binders.set(node, binder);

            binder.render();
        }
    }

    #walk (method, node) {
        let child = (node ?? this)?.firstChild;
        while (child) {
            method(child);
            if (!child?.attributes?.bind?.value?.includes('each:')) {
                this.#walk(method, child);
            }
            child = child.nextSibling;
        }
    }

    async connectedCallback () {
        if (this.#setup) return;
        else this.#setup = true;

        let data = {};
        if (this.data) data = await this.data();

        this.#data = new Proxy(data, {
            get: get.bind(null, this.#task.bind(this), ''),
            set: set.bind(null, this.#task.bind(this), ''),
            deleteProperty: deleteProperty.bind(null, this.#task.bind(this), '')
        });

        // let render = `<style>:host{display:block;}</style><slot></slot>`;
        // if (this.render) render = await this.render();
        // this.#template.innerHTML = render;
        // this.#shadow.appendChild(this.#template.content);

        let render;
        if (this.render) render = await this.render();
        this.#template.innerHTML = render;
        this.appendChild(this.#template.content);

        await this.#walk(node => this.#bind(node));

        // customElements.whenDefined(this.localName).then(() => this.#walk(node => this.#bind(node)));
    }

}