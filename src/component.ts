import Observer from './observer';
import Binder from './binder';
import Css from './css';

export default class Component extends HTMLElement {

    static attributes: string[];
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #root: any;
    #binder: any;
    // #template: any;
    #flag: boolean = false;
    #ready: boolean = false;
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

    #readyEvent = new Event('ready');
    #afterRenderEvent = new Event('afterrender');
    #beforeRenderEvent = new Event('beforerender');
    #afterConnectedEvent = new Event('afterconnected');
    #beforeConnectedEvent = new Event('beforeconnected');

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
    get ready () { return this.#ready; }
    get binder () { return this.#binder; }

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

        // this.#template = document.createElement('template');
        // this.#template.innerHTML = this.html;

    }

    async #observe (path, type) {

        const parents = this.#binder.pathBinders.get(path);
        if (parents) {
            // console.log('path:',path);
            const parentTasks = [];
            for (const binder of parents) {
                if (!binder) continue;
                parentTasks.push(binder[ type ]());
            }
            await Promise.all(parentTasks);
        }

        for (const [ key, children ] of this.#binder.pathBinders) {
            if (!children) continue;
            if (key.startsWith(`${path}.`)) {
                // console.log('key:', key);
                for (const binder of children) {
                    if (!binder) continue;
                    binder[ type ]();
                }
            }
        }

    };

    async #render () {
        const tasks = [];

        this.data = Observer(
            typeof this.data === 'function' ? await this.data() : this.data,
            this.#observe.bind(this)
        );

        if (this.adopt) {
            let child = this.firstChild;
            while (child) {
                tasks.push(this.#binder.add(child, this, this.data));
                // this.#binder.add(child, this, this.data);
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
            tasks.push(this.#binder.add(child, this, this.data));
            // this.#binder.add(child, this, this.data);
            child = child.nextSibling;
        }

        this.#root.appendChild(template.content);
        await Promise.all(tasks);
    }

    // async whenReady () {
    //     if (!this.#ready) {
    //         return new Promise(resolve => this.addEventListener('afterrender', resolve));
    //     }
    // }

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
        Css.attach(this.#name, this.css);

        if (!this.#flag) {
            this.#flag = true;
            this.dispatchEvent(this.#beforeRenderEvent);
            await this.#render();
            if (this.#rendered) await this.#rendered();
            this.dispatchEvent(this.#afterRenderEvent);
            this.#ready = true;
            this.dispatchEvent(this.#readyEvent);
        }

        this.dispatchEvent(this.#beforeConnectedEvent);
        if (this.#connected) await this.#connected();
        this.dispatchEvent(this.#afterConnectedEvent);
    }

}
