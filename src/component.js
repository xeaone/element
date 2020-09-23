import Observer from './observer.js';
import Binder from './binder.js';
// import Style from './style.js';

const Slot = function (element, fragment) {
    const fragmentSlots = fragment.querySelectorAll('slot[name]');
    const defaultSlot = fragment.querySelector('slot:not([name])');

    for (let i = 0; i < fragmentSlots.length; i++) {

        const fragmentSlot = fragmentSlots[i];
        const name = fragmentSlot.getAttribute('name');
        const elementSlot = element.querySelector('[slot="'+ name + '"]');

        if (elementSlot) {
            fragmentSlot.parentNode.replaceChild(elementSlot, fragmentSlot);
        } else {
            fragmentSlot.parentNode.removeChild(fragmentSlot);
        }

    }

    if (defaultSlot) {
        if (element.children.length) {
            while (element.firstChild) {
                defaultSlot.parentNode.insertBefore(element.firstChild, defaultSlot);
            }
        }
        defaultSlot.parentNode.removeChild(defaultSlot);
    }

};

const Fragment = function (element, template, adopt) {
    const fragment = document.createDocumentFragment();
    const clone = template.cloneNode(true);

    let child = clone.firstElementChild;
    while (child) {

        if (!adopt) {
            Binder.add(child, element, element.scope);
        }

        fragment.appendChild(child);
        child = clone.firstElementChild;
    }

    return fragment;
};

class Component extends HTMLElement {

    // static #count = 0
    static count = 0
    static attributes = []
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #template = ''
    get template () { return this.#template; }

    #model = {}
    get model () { return this.#model; }

    #methods = {}
    get methods () { return this.#methods; }

    #scope = ''
    get scope () { return this.#scope; }

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


        this.#methods = this.constructor.methods || {};
        this.#scope = `${this.nodeName.toLowerCase()}-${this.constructor.count++}`;
        this.#template = new DOMParser().parseFromString(this.constructor.template || '' , 'text/html').body;

        this.#model = Observer.create(this.constructor.model || {} , (data, path) => {
            const location = `${this.scope}.${path}`;
            Binder.data.forEach(binder => {
                if (binder.location === location) {
                    Binder.render(binder);
                }
            });
        }); 

        this.render();
    }

    render () {

        const fragment = Fragment(this, this.template);

        let root;

        if (this.shadow && 'attachShadow' in document.body) {
            root = this.attachShadow({ mode: 'open' });
        } else if (this.shadow && 'createShadowRoot' in document.body) {
            root = this.createShadowRoot();
        } else {

            if (fragment) {
                Slot(this, fragment);
            }

            root = this;
        }

        if (fragment) {
            root.appendChild(fragment);
        }

        if (this.adopt) {
            let child = root.firstElementChild;
            while (child) {
                Binder.add(child, this, this.scope);
                child = child.nextElementSibling;
            }
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
            Promise.resolve().then(() => this.created()).then(() => this.attached());
        }
    }

}

export default Component;
