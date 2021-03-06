import Observer from './observer';
import Binder from './binder';
import Css from './css';

export default class Component extends HTMLElement {

    static template = '';
    static model = {};
    static attributes = [];
    static get observedAttributes() { return this.attributes; }
    static set observedAttributes(attributes) { this.attributes = attributes; }

    #CREATED: boolean;

    #css = Css;
    #binder = Binder;

    #root: any;
    #name: string;
    #model: object;
    #adopt: boolean;
    #shadow: boolean;

    #adopted: () => any;
    #created: () => any;
    #attached: () => any;
    #detached: () => any;
    #attributed: (name, oldValue, newValue) => any;

    get css() { return this.#css; }
    get root() { return this.#root; }
    get model() { return this.#model; }
    get binder() { return this.#binder; }

    // #template = '';
    // get template () { return this.#template; }

    // #methods = {};
    // get methods () { return this.#methods; }

    constructor() {
        super();

        this.#adopt = typeof (this.constructor as any).adopt === 'boolean' ? (this.constructor as any).adopt.bind(this) : false;
        this.#shadow = typeof (this.constructor as any).shadow === 'boolean' ? (this.constructor as any).shadow.bind(this) : false;
        this.#adopted = typeof (this.constructor as any).adopted === 'function' ? (this.constructor as any).adopted.bind(this) : function () { };
        this.#created = typeof (this.constructor as any).created === 'function' ? (this.constructor as any).created.bind(this) : function () { };
        this.#attached = typeof (this.constructor as any).attached === 'function' ? (this.constructor as any).attached.bind(this) : function () { };
        this.#detached = typeof (this.constructor as any).detached === 'function' ? (this.constructor as any).detached.bind(this) : function () { };
        this.#attributed = typeof (this.constructor as any).attributed === 'function' ? (this.constructor as any).attributed.bind(this) : function () { };

        this.#name = this.nodeName.toLowerCase();
        // this.#methods = this.constructor.methods || {};
        // this.#template = this.constructor.template || '';

        this.#model = Observer.clone((this.constructor as any).model, (data, path) => {
            Binder.data.forEach(binder => {
                if (binder.container === this && binder.path.startsWith(path)) {
                    // if (binder.container === this && binder.path.includes(path)) {
                    // if (binder.container === this && binder.path === path) {
                    Binder.render(binder);
                }
            });
        });

    }

    async sloted(template) {
        const templateSlots = template.querySelectorAll('slot[name]');
        const defaultSlot = template.querySelector('slot:not([name])');

        for (let i = 0; i < templateSlots.length; i++) {

            const templateSlot = templateSlots[i];
            const name = templateSlot.getAttribute('name');
            const instanceSlot = this.querySelector('[slot="' + name + '"]');

            if (instanceSlot) {
                templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
            } else {
                templateSlot.parentNode.removeChild(templateSlot);
            }

        }

        if (this.children.length) {
            while (this.firstChild) {
                if (defaultSlot) {
                    defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
                } else {
                    this.removeChild(this.firstChild);
                }
            }
        }

        if (defaultSlot) {
            defaultSlot.parentNode.removeChild(defaultSlot);
        }

    }

    async render() {

        if (this.#adopt === true) {
            let child = this.firstElementChild;
            while (child) {
                Binder.add(child, this);
                child = child.nextElementSibling;
            }
        }

        const template = document.createElement('template');
        template.innerHTML = (this.constructor as any).template;
        const clone = template.content.cloneNode(true) as Element;

        if (this.#shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.#shadow && 'createShadowRoot' in document.body) {
            this.#root = (this as any).createShadowRoot();
        } else {
            this.sloted(clone);
            this.#root = this;
        }

        // if (fragment) root.appendChild(fragment);
        // root.appendChild(fragment);

        let child = clone.firstElementChild;
        while (child) {
            // if (this.#adopt === false) 
            Binder.add(child, this);
            this.#root.appendChild(child);
            child = clone.firstElementChild;
        }

    }

    async attributeChangedCallback(name, oldValue, newValue) {
        // Promise.resolve().then(() => this.#attributed(name, oldValue, newValue));
        await this.#attributed(name, oldValue, newValue);
    }

    async adoptedCallback() {
        // Promise.resolve().then(() => this.#adopted());
        await this.#adopted();
    }

    async disconnectedCallback() {
        this.#css.detach(this.#name);
        // Promise.resolve().then(() => this.#detached());
        await this.#detached();
    }

    async connectedCallback() {
        this.#css.attach(this.#name, (this.constructor as any).css);

        if (this.#CREATED) {
            // Promise.resolve().then(() => this.#attached());
            await this.#attached();
        } else {
            this.#CREATED = true;
            this.render();
            // Promise.resolve().then(() => this.#created()).then(() => this.#attached());
            await this.#created();
            await this.#attached();
        }
    }

}
