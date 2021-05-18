import Observer from './observer';
import Binder from './binder';
import Css from './css';

export default class Component extends HTMLElement {

    static attributes: [];
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #root: any;
    #css: string;
    #html: string;
    #data: object;
    #adopt: boolean;
    #shadow: boolean;
    #flag: boolean = false;
    #name: string = this.nodeName.toLowerCase();
    // #css: string = typeof (this as any).css === 'string' ? (this as any).css : '';
    // #html: string = typeof (this as any).html === 'string' ? (this as any).html : '';
    // #data: object = typeof (this as any).data === 'object' ? (this as any).data : {};
    // #adopt: boolean = typeof (this as any).adopt === 'boolean' ? (this as any).adopt : false;
    // #shadow: boolean = typeof (this as any).shadow === 'boolean' ? (this as any).shadow : false;
    #adopted: () => any = typeof (this as any).adopted === 'function' ? (this as any).adopted : null;
    #rendered: () => any = typeof (this as any).rendered === 'function' ? (this as any).rendered : null;
    #connected: () => any = typeof (this as any).connected === 'function' ? (this as any).connected : null;
    #disconnected: () => any = typeof (this as any).disconnected === 'function' ? (this as any).disconnected : null;
    #attributed: (name, from, to) => any = typeof (this as any).attributed === 'function' ? (this as any).attributed : null;

    css: string = '';
    html: string = '';
    data: object = {};
    adopt: boolean = false;
    shadow: boolean = false;

    get root () { return this.#root; }
    get binder () { return Binder; }

    constructor () {
        super();

        if (this.#shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.#shadow && 'createShadowRoot' in document.body) {
            this.#root = (this as any).createShadowRoot();
        } else {
            this.#root = this;
        }

    }

    async render () {

        this.#html = this.#html ?? this.html;
        this.#data = this.#data ?? this.data;
        this.#adopt = this.#adopt ?? this.adopt;
        this.#shadow = this.#shadow ?? this.shadow;

        this.data = Observer.clone(this.#data, (_, path) => {
            Binder.data.forEach(binder => {
                if (binder.container === this && binder.path === path && !binder.busy) {
                    // if (binder.container === this && binder.path === path) {
                    // if (binder.container === this && binder.path.startsWith(path)) {
                    // if (binder.container === this && binder.path.startsWith(path) && !binder.busy) {
                    binder.render();
                }
            });
        });

        if (this.#adopt === true) {
            let child = this.firstChild;
            while (child) {
                Binder.add(child, this);
                child = child.nextSibling;
            }
        }

        const template = document.createElement('template');
        template.innerHTML = this.#html;
        // const clone = template.content.cloneNode(true) as DocumentFragment;
        // const clone = document.importNode(template.content, true);
        const clone = document.adoptNode(template.content);

        if (
            !this.#shadow ||
            !('attachShadow' in document.body) &&
            !('createShadowRoot' in document.body)
        ) {
            const templateSlots = clone.querySelectorAll('slot[name]');
            const defaultSlot = clone.querySelector('slot:not([name])');

            for (let i = 0; i < templateSlots.length; i++) {
                const templateSlot = templateSlots[ i ];
                const name = templateSlot.getAttribute('name');
                const instanceSlot = this.querySelector('[slot="' + name + '"]');
                if (instanceSlot) templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
                else templateSlot.parentNode.removeChild(templateSlot);
            }

            if (this.children.length) {
                while (this.firstChild) {
                    if (defaultSlot) defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
                    else this.removeChild(this.firstChild);
                }
            }

            if (defaultSlot) defaultSlot.parentNode.removeChild(defaultSlot);
        }

        let child = clone.firstChild;
        while (child) {
            Binder.add(child, this);
            child = child.nextSibling;
        }

        this.#root.appendChild(clone);

    }

    async attributeChangedCallback (name, from, to) {
        await this.#attributed(name, from, to);
    }

    async adoptedCallback () {
        if (this.#adopted) await this.#adopted();
    }

    async disconnectedCallback () {
        Css.detach(this.#name);
        if (this.#disconnected) await this.#disconnected();
    }

    async connectedCallback () {
        this.#css = this.#css ?? this.css;

        Css.attach(this.#name, this.#css);

        if (this.#flag) {
            if (this.#connected) await this.#connected();
        } else {
            this.#flag = true;
            await this.render();
            if (this.#rendered) await this.#rendered();
            if (this.#connected) await this.#connected();
        }
    }

}
