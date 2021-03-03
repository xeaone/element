import Observer from './observer';
import Binder from './binder';
import Css from './css';

const compose = function (instance, template) {
    const templateSlots = template.querySelectorAll('slot[name]');
    const defaultSlot = template.querySelector('slot:not([name])');

    for (let i = 0; i < templateSlots.length; i++) {

        const templateSlot = templateSlots[i];
        const name = templateSlot.getAttribute('name');
        const instanceSlot = instance.querySelector('[slot="' + name + '"]');

        if (instanceSlot) {
            templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
        } else {
            templateSlot.parentNode.removeChild(templateSlot);
        }

    }

    if (instance.children.length) {
        while (instance.firstChild) {
            if (defaultSlot) {
                defaultSlot.parentNode.insertBefore(instance.firstChild, defaultSlot);
            } else {
                instance.removeChild(instance.firstChild);
            }
        }
    }

    if (defaultSlot) {
        defaultSlot.parentNode.removeChild(defaultSlot);
    }

};

export default class Component extends HTMLElement {

    static model = {};
    static template = '';
    static attributes = [];
    static get observedAttributes() { return this.attributes; }
    static set observedAttributes(attributes) { this.attributes = attributes; }

    CREATED: boolean;

    #css = Css;
    #binder = Binder;

    #root: any;
    #name: string;
    #adopt: boolean;
    #shadow: boolean;
    #model: Object | Array<any>;

    #adopted: () => any;
    #created: () => any;
    #attached: () => any;
    #detached: () => any;
    #attributed: (name, oldValue, newValue) => any;

    get css() { return this.#css; }
    get model() { return this.#model; }
    get binder() { return this.#binder; }

    // #template = '';
    // get template () { return this.#template; }


    // #methods = {};
    // get methods () { return this.#methods; }

    constructor() {
        super();

        this.#adopt = typeof (this.constructor as any).adopt === 'boolean' ? (this.constructor as any).adopt : false;
        this.#shadow = typeof (this.constructor as any).shadow === 'boolean' ? (this.constructor as any).shadow : false;
        this.#adopted = typeof (this.constructor as any).adopted === 'function' ? (this.constructor as any).adopted : function () { };
        this.#created = typeof (this.constructor as any).created === 'function' ? (this.constructor as any).created : function () { };
        this.#attached = typeof (this.constructor as any).attached === 'function' ? (this.constructor as any).attached : function () { };
        this.#detached = typeof (this.constructor as any).detached === 'function' ? (this.constructor as any).detached : function () { };
        this.#attributed = typeof (this.constructor as any).attributed === 'function' ? (this.constructor as any).attributed : function () { };

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

    render() {

        const template = document.createElement('template');
        template.innerHTML = (this.constructor as any).template;

        const clone = template.content.cloneNode(true) as Element;

        if (this.#adopt === true) {
            let child = this.firstElementChild;
            while (child) {
                Binder.add(child, this);
                child = child.nextElementSibling;
            }
        }

        if (this.#shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.#shadow && 'createShadowRoot' in document.body) {
            this.#root = (this as any).createShadowRoot();
        } else {
            compose(this, clone);
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

    attributeChangedCallback(name, oldValue, newValue) {
        Promise.resolve().then(() => this.#attributed(name, oldValue, newValue));
    }

    adoptedCallback() {
        Promise.resolve().then(() => this.#adopted());
    }

    disconnectedCallback() {
        this.#css.detach(this.#name);
        Promise.resolve().then(() => this.#detached());
    }

    connectedCallback() {
        this.#css.attach(this.#name, (this.constructor as any).css);

        if (this.CREATED) {
            Promise.resolve().then(() => this.#attached());
        } else {
            this.CREATED = true;
            this.render();
            Promise.resolve().then(() => this.#created()).then(() => this.#attached());
        }
    }

}
