import Observer from './observer';
import Binder from './binder';
import Css from './css';

const tick = Promise.resolve();

export default class Component extends HTMLElement {

    static attributes: string[];
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #root: any;
    #binder: any;
    #flag: boolean = false;
    #name: string = this.nodeName.toLowerCase();

    // this overwrites extends methods
    // adopted: () => void;
    // rendered: () => void;
    // connected: () => void;
    // disconnected: () => void;
    // attributed: (name: string, from: string, to: string) => void;

    #adopted: () => void;
    #rendered: () => void;
    #connected: () => void;
    #disconnected: () => void;
    #attributed: (name: string, from: string, to: string) => void;

    #beforeConnectedEvent = new Event('beforeconnected');
    #afterConnectedEvent = new Event('afterconnected');

    // #css: string = typeof (this as any).css === 'string' ? (this as any).css : '';
    // #html: string = typeof (this as any).html === 'string' ? (this as any).html : '';
    // #data: object = typeof (this as any).data === 'object' ? (this as any).data : {};
    // #adopt: boolean = typeof (this as any).adopt === 'boolean' ? (this as any).adopt : false;
    // #shadow: boolean = typeof (this as any).shadow === 'boolean' ? (this as any).shadow : false;

    css: string = '';
    html: string = '';
    data: object = {};
    adopt: boolean = false;
    shadow: boolean = false;

    get root () { return this.#root; }
    get binder () { return Binder; }

    constructor () {
        super();

        this.#binder = new Binder();
        this.#adopted = (this as any).adopted;
        this.#rendered = (this as any).rendered;
        this.#connected = (this as any).connected;
        this.#attributed = (this as any).attributed;
        this.#disconnected = (this as any).disconnected;

        if (this.shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.shadow && 'createShadowRoot' in document.body) {
            this.#root = (this as any).createShadowRoot();
        } else {
            this.#root = this;
        }

    }

    async render () {
        const tasks = [];

        const observer = async (path) => {
            // console.log(path);

            const binders = this.#binder.pathBinders.get(path);
            if (!binders) return;
            // console.log(path, binders);

            // const tasks = [];
            for (const binder of binders.values()) {
                binder.render();
                // tasks.push(binder.render(message));
                // tick.then(binder.render.bind(null, message));
            }

            // return Promise.all(tasks);
        };

        this.data = Observer(this.data, observer);

        if (this.adopt) {
            let child = this.firstChild;
            while (child) {
                // tick.then(this.#binder.add.bind(this.#binder, child, this));
                tasks.push(this.#binder.add(child, this));
                child = child.nextSibling;
            }
        }

        const template = document.createElement('template');
        template.innerHTML = this.html;

        if (
            !this.shadow ||
            !('attachShadow' in document.body) &&
            !('createShadowRoot' in document.body)
        ) {
            const templateSlots = template.content.querySelectorAll('slot[name]');
            const defaultSlot = template.content.querySelector('slot:not([name])');

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


        let child = template.content.firstChild;
        while (child) {
            tasks.push(this.#binder.add(child, this));
            child = child.nextSibling;
        }

        await Promise.all(tasks);
        this.#root.appendChild(template.content);
    }

    async attributeChangedCallback (name: string, from: string, to: string) {
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
        try {
            Css.attach(this.#name, this.css);
            if (!this.#flag) {
                this.#flag = true;
                await this.render();
                if (this.#rendered) await this.#rendered();
            }

            this.dispatchEvent(this.#beforeConnectedEvent);
            if (this.#connected) await this.#connected();
            this.dispatchEvent(this.#afterConnectedEvent);
        } catch (error) {
            console.error(error);
        }
    }

}
