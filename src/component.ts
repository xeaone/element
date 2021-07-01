import Observer from './observer';
import Binder from './binder';
import Css from './css';

export default class Component extends HTMLElement {

    static attributes: string[];
    static get observedAttributes () { return this.attributes; }
    static set observedAttributes (attributes) { this.attributes = attributes; }

    #root: any;
    #flag: boolean = false;
    #name: string = this.nodeName.toLowerCase();

    adopted: () => void;
    rendered: () => void;
    connected: () => void;
    disconnected: () => void;
    attributed: (name: string, from: string, to: string) => void;
    // #adopted: () => void;
    // #rendered: () => void;
    // #connected: () => void;
    // #disconnected: () => void;
    // #attributed: (name: string, from: string, to: string) => void;
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

        if (this.shadow && 'attachShadow' in document.body) {
            this.#root = this.attachShadow({ mode: 'open' });
        } else if (this.shadow && 'createShadowRoot' in document.body) {
            this.#root = (this as any).createShadowRoot();
        } else {
            this.#root = this;
        }

    }

    async render () {

        this.data = Observer(this.data, async function observer (path) {
            // console.log(path);
            const binders = Binder.get(path);
            if (!binders) return;
            // const tasks = [];
            for (const [ , binder ] of binders) {
                // tasks.push(binder.render());
                binder.render();
            }
            // return Promise.all(tasks);
        });

        if (this.adopt) {
            Binder.adds(this, this);
            // let child = this.firstChild;
            // while (child) {
            //     Binder.add(child, this);
            //     child = child.nextSibling;
            // }
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

        // const tasks = [];
        // let child = template.content.firstChild;
        // while (child) {
        //     tasks.push(Binder.add(child, this));
        //     child = child.nextSibling;
        // }

        Binder.adds(template.content, this);
        this.#root.appendChild(template.content);

        // return Promise.all(tasks);
    }

    async attributeChangedCallback (name: string, from: string, to: string) {
        await this.attributed(name, from, to);
    }

    async adoptedCallback () {
        if (this.adopted) await this.adopted();
    }

    async disconnectedCallback () {
        Css.detach(this.#name);
        if (this.disconnected) await this.disconnected();
    }

    async connectedCallback () {
        try {
            Css.attach(this.#name, this.css);

            if (this.#flag) {
                if (this.connected) await this.connected();
            } else {
                this.#flag = true;
                await this.render();
                // if (this.rendered) await this.rendered();
                if (this.connected) await this.connected();
            }
        } catch (error) {
            console.error(error);
        }
    }

}

// export default function decorate (target) {

//     Object.defineProperties(target.prototype, {
//         observedAttributes: {
//             get () {
//                 console.log('goa', target.attributes, this);
//                 return target.attributes;
//             },
//             set (attributes) {
//                 console.log('soa', attributes);
//                 target.attributes = attributes;
//             }
//         },
//         $name: { value: this.nodeName.toLowerCase() }
//     });

//     // #root: any;
//     // #flag: boolean = false;

//     // adopted: () => void;
//     // rendered: () => void;
//     // connected: () => void;
//     // disconnected: () => void;
//     // attributed: (name: string, from: string, to: string) => void;

//     // css: string = '';
//     // html: string = '';
//     // data: object = {};
//     // adopt: boolean = false;
//     // shadow: boolean = false;

//     // get root() { return this.#root; }
//     // get binder() { return Binder; }

//     // constructor() {
//     //     super();

//     //     if (this.shadow && 'attachShadow' in document.body) {
//     //         this.#root = this.attachShadow({ mode: 'open' });
//     //     } else if (this.shadow && 'createShadowRoot' in document.body) {
//     //         this.#root = (this as any).createShadowRoot();
//     //     } else {
//     //         this.#root = this;
//     //     }

//     // }

//     Object.defineProperties(target, {
//         $render: {
//             value: async function () {

//                 if (this.shadow && 'attachShadow' in document.body) {
//                     this.$root = this.attachShadow({ mode: 'open' });
//                 } else if (this.shadow && 'createShadowRoot' in document.body) {
//                     this.$root = (this as any).createShadowRoot();
//                 } else {
//                     this.$root = this;
//                 }

//                 this.data = Observer(this.data, async path => {
//                     for (const [ , binder ] of Binder.data) {
//                         if (binder.container === this && binder.path === path && !binder.busy) {
//                             binder.busy = true;
//                             await binder.render();
//                             binder.busy = false;
//                         }
//                     }
//                 });

//                 if (this.adopt) {
//                     let child = this.firstChild;
//                     while (child) {
//                         Binder.add(child, this);
//                         child = child.nextSibling;
//                     }
//                 }

//                 const template = document.createElement('template');
//                 template.innerHTML = this.html;
//                 // const clone = template.content.cloneNode(true) as DocumentFragment;
//                 // const clone = document.importNode(template.content, true);
//                 // const clone = document.adoptNode(template.content);

//                 if (
//                     !this.shadow ||
//                     !('attachShadow' in document.body) &&
//                     !('createShadowRoot' in document.body)
//                 ) {
//                     const templateSlots = template.content.querySelectorAll('slot[name]');
//                     const defaultSlot = template.content.querySelector('slot:not([name])');

//                     for (let i = 0; i < templateSlots.length; i++) {
//                         const templateSlot = templateSlots[ i ];
//                         const name = templateSlot.getAttribute('name');
//                         const instanceSlot = this.querySelector('[slot="' + name + '"]');
//                         if (instanceSlot) templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
//                         else templateSlot.parentNode.removeChild(templateSlot);
//                     }

//                     if (this.children.length) {
//                         while (this.firstChild) {
//                             if (defaultSlot) defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
//                             else this.removeChild(this.firstChild);
//                         }
//                     }

//                     if (defaultSlot) defaultSlot.parentNode.removeChild(defaultSlot);
//                 }

//                 const tasks = [];
//                 let child = template.content.firstChild;
//                 while (child) {
//                     tasks.push(Binder.add(child, this));
//                     child = child.nextSibling;
//                 }
//                 this.$root.appendChild(template.content);

//                 return Promise.all(tasks);
//             }
//         },
//         attributeChangedCallback: {
//             value: async function (name: string, from: string, to: string) {
//                 await this.attributed(name, from, to);
//             }
//         },
//         adoptedCallback: {
//             value: async function () {
//                 if (this.adopted) await this.adopted();
//             }
//         },
//         disconnectedCallback: {
//             value: async function () {
//                 Css.detach(this.$name);
//                 if (this.disconnected) await this.disconnected();
//             }
//         },
//         connectedCallback: {
//             value: async function () {
//                 try {
//                     Css.attach(this.$name, this.css);

//                     if (this.$flag) {
//                         if (this.connected) await this.connected();
//                     } else {
//                         this.$flag = true;
//                         await this.render();
//                         if (this.rendered) await this.rendered();
//                         if (this.connected) await this.connected();
//                     }
//                 } catch (error) {
//                     console.error(error);
//                 }
//             }
//         }
//     });

// }