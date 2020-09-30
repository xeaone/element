import Observer from './observer.js';
import Binder from './binder.js';
// import Style from './style.js';

const compose = function (instance, template) {
    const templateSlots = template.querySelectorAll('slot[name]');
    const defaultSlot = template.querySelector('slot:not([name])');

    for (let i = 0; i < templateSlots.length; i++) {

        const templateSlot = templateSlots[i];
        const name = templateSlot.getAttribute('name');
        const instanceSlot = instance.querySelector('[slot="'+ name + '"]');

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

class Component extends HTMLElement {

    static count = 0
    static attributes = []
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #root


    #binder
    get binder () { return this.#binder; }

    #template = ''
    get template () { return this.#template; }

    #model = {}
    get model () { return this.#model; }

    #methods = {}
    get methods () { return this.#methods; }

    constructor () {
        super();

        this.adopt = typeof this.adopt === 'boolean' ? this.adopt : false;
        this.shadow = typeof this.shadow === 'boolean' ? this.shadow : false;
        this.adopted = typeof this.adopted === 'function' ? this.adopted : function () {};
        this.created = typeof this.created === 'function' ? this.created : function () {};
        this.attached = typeof this.attached === 'function' ? this.attached : function () {};
        this.detached = typeof this.detached === 'function' ? this.detached : function () {};

        // if (typeof this.style === 'string') {
        //     Style.append(
        //         this.style
        //             .replace(/\n|\r|\t/g, '')
        //             .replace(/:host/g, name)
        //     );
        // }

        this.#binder = Binder;

        this.#methods = this.constructor.methods || {};
        this.#template = this.constructor.template || '';

        this.#model = Observer.create(this.constructor.model || {} , (data, path) => {
            Binder.data.forEach(binder => {
                if (binder.container === this && binder.path === path) {
                    Binder.render(binder);
                }
            });
        }); 

    }

    render () {

        const template = document.createElement('template');
        template.innerHTML = this.template;

        const clone = template.content.cloneNode(true);

        if (this.adopt === true) {
            let child = this.firstElementChild;
            while (child) {
                Binder.add(child, this);
                child = child.nextElementSibling;
            }
        }

        if (this.shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.shadow && 'createShadowRoot' in document.body) {
            this.#root = this.createShadowRoot();
        } else {
            compose(this, clone);
            this.#root = this;
        }

        // if (fragment) root.appendChild(fragment);
        // root.appendChild(fragment);

        let child = clone.firstElementChild;
        while (child) {
            // if (this.adopt === false) 
            Binder.add(child, this);
            this.#root.appendChild(child);
            child = clone.firstElementChild;
        }

    }

    attributeChangedCallback () {
        Promise.resolve().then(() => this.attributed(...arguments));
    }

    adoptedCallback () {
        Promise.resolve().then(() => this.adopted());
    }

    disconnectedCallback () {
        Promise.resolve().then(() => this.detached());
    }

    connectedCallback () {
        if (this.CREATED) {
            Promise.resolve().then(() => this.attached());
        } else {
            this.CREATED = true;
            this.render();
            Promise.resolve().then(() => this.created()).then(() => this.attached());
        }
    }

}

export default Component;
