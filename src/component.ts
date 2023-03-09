// import Context from './context';
import Schedule from './schedule';
// import Patch from './patch';
import Dash from './dash';
// import render from './render';
import html from './html';
import observe from './observe';
import { getOwnPropertyDescriptors, replaceChildren } from './poly';
import { RenderWalk } from './render';

// const DEFINED = new WeakSet();
// const CE = window.customElements;
// Object.defineProperty(window, 'customElements', {
//     get: () => ({
//         define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
//             if (constructor.prototype instanceof Component && !DEFINED.has(constructor)) {
//                 constructor = new Proxy(constructor, {
//                     construct(target, args, extender) {
//                         const instance = Reflect.construct(target, args, extender);
//                         instance[upgrade]();
//                         return instance;
//                     },
//                 });

//                 DEFINED.add(constructor);
//             }
//             CE.define(name, constructor, options);
//         },
//         get: CE.get,
//         whenDefined: CE.whenDefined,
//     }),
// });


    // static slottedEvent = new Event('slotted');
    // static slottingEvent = new Event('slotting');

    // static adoptedEvent = new Event('adopted');
    // static adoptingEvent = new Event('adopting');

    // static updatedEvent = new Event('updated');
    // static updatingEvent = new Event('updating');

    // static upgradedEvent = new Event('upgraded');
    // static upgradingEvent = new Event('upgrading');

    // static connectedEvent = new Event('connected');
    // static connectingEvent = new Event('connecting');

    // static attributedEvent = new Event('attributed');
    // static attributingEvent = new Event('attributing');

    // static disconnectedEvent = new Event('disconnected');
    // static disconnectingEvent = new Event('disconnecting');

    // slotted?: ()=>Promise<void> | void;
    // connecting?: ()=>Promise<void> | void;
    // connected?: ()=>Promise<void> | void;
    // attributed?: (name: string, from: string, to: string)=>Promise<void> | void;
    // adopted?: ()=>Promise<void> | void;
    // disconnected?: ()=>Promise<void> | void;

    // async slottedCallback() {
    //     this.dispatchEvent(XElement.slottingEvent);
    //     await this.slotted?.();
    //     this.dispatchEvent(XElement.slottedEvent);
    // }

    // async connectedCallback() {
    //     this.dispatchEvent(XElement.connectingEvent);
    //     await this.connecting?.();
    //     this.#render();
    //     // this[MOUNT](this[ROOT], this.#context, this.#template);

    //     // const constructor = this.constructor as typeof XElement;
    //     // this[MOUNT](this[ROOT], constructor.context, constructor.template);
    //     await this.connected?.();
    //     this.dispatchEvent(XElement.connectedEvent);
    // }

    // async disconnectedCallback() {
    //     this.dispatchEvent(XElement.disconnectingEvent);
    //     await this.disconnected?.();
    //     this.dispatchEvent(XElement.disconnectedEvent);
    // }

    // async adoptedCallback() {
    //     this.dispatchEvent(XElement.adoptingEvent);
    //     await this.adopted?.();
    //     this.dispatchEvent(XElement.adoptedEvent);
    // }

    // async attributeChangedCallback(name: string, from: string, to: string) {
    //     this.dispatchEvent(XElement.attributingEvent);
    //     await this.attributed?.(name, from, to);
    //     this.dispatchEvent(XElement.attributedEvent);
    // }


export const ROOT = Symbol('root');
export const MOUNT = Symbol('mount');
export const UPDATE = Symbol('update');

export const BUSY = Symbol('busy');
export const ACTIONS = Symbol('actions');
export const FRAGMENT = Symbol('fragment');
export const EXPRESSIONS = Symbol('expressions');

const create = function (this:any) {
    const tag = this.tag ?? Dash(this.name);

    if (!customElements.get(tag)) {
        customElements.define(tag, this);
    }

    const element = document.createElement(tag) as any;
    element[MOUNT]();

    return element;
};

const define = function (this:any) {
    const tag = this.tag ?? Dash(this.name);
    if (!customElements.get(tag)) return;
    customElements.define(tag, this);
};

const defined = function (this:any) {
    const tag = this.tag ?? Dash(this.name);
    return customElements.whenDefined(tag);
};

const update = async function (this:any) {
    if (this[BUSY]) return;
    else this[BUSY] = true;

    // await sleep(50);

    // if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { values } = this.template();
    // const { values } = this.template(this.#c);
    // const { values } = this.#template.call(this.#c, this.#c);
    const expressions = values;

    const length = this[ACTIONS].length;
    for (let index = 0; index < length; index++) {
        this[ACTIONS][index](this[EXPRESSIONS][index], expressions[index]);
    }

    this[EXPRESSIONS] = expressions;

    // if (context.upgraded) await context.upgraded()?.catch(console.error);

    // instance.busy = false;
    this[BUSY] = false;
};

const mount = async function (this:any) {
    console.log(this)
    // const instance: any = {};

    // const cache = RootCache.get(root);
    // if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    // if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

    // this.#c = observe(this, ()=>this.#update());
    // this.#c = observe(this, this.#update.bind(this));
    // this.#c = observe(this.#context(), this.#update);

    // RootCache.set(root, context);

    // if (context.connect) await context.connect()?.catch?.(console.error);
    // if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const { values, template } = this.template();
    // const { values, template } = this.#template(this.#c);
    // const { values, template } = this.#template.call(this.#c, this.#c);
    // this.#t = template;
    this[EXPRESSIONS] = values;

    this[FRAGMENT] = template.content.cloneNode(true) as DocumentFragment;

    RenderWalk(this[FRAGMENT], this[EXPRESSIONS], this[ACTIONS]);

    document.adoptNode(this[FRAGMENT]);

    const length = this[ACTIONS].length;
    for (let index = 0; index < length; index++) {
        this[ACTIONS][index](undefined, this[EXPRESSIONS][index]);
    }

    if (this[ROOT].replaceChildren) {
        this[ROOT].replaceChildren(this[FRAGMENT]);
    } else {
        replaceChildren(this[ROOT], this[FRAGMENT]);
    }

    // if (context.upgraded) await context.upgraded()?.catch(console.error);
    // if (context.connected) await context.connected()?.catch(console.error);
};

export default function component (Class:any) {

    Class.create = create;
    Class.define = define;
    Class.defined = defined;
    Class.tag = Class.tag || Dash(Class.name);

    Object.defineProperties(Class.prototype, {
        [UPDATE]: {
            value: update,
            writable: false,
            enumerable: false,
            configurable: false,
        },
        [MOUNT]: {
            value: mount,
            writable: false,
            enumerable: false,
            configurable: false,
       }
    });

    const proxy =  new Proxy(Class, {
        construct(target, args, extender) {
            const self = Reflect.construct(target, args, extender) as any;

            Object.defineProperties(self, {
                [BUSY]: {
                    value: false,
                    writable: true,
                    enumerable: false,
                    configurable: false,
                },
                [ACTIONS]: {
                    value: [],
                    writable: true,
                    enumerable: false,
                    configurable: false,
                },
                [EXPRESSIONS]: {
                    value: [],
                    writable: true,
                    enumerable: false,
                    configurable: false,
                },
                [FRAGMENT]: {
                    value: undefined,
                    writable: true,
                    enumerable: false,
                    configurable: false,
                },
                [ROOT]: {
                    value: target.shadow === true ? self.shadowRoot ?? self.attachShadow({ mode: 'open' }) : self,
                    writable: true,
                    enumerable: false,
                    configurable: false,
                },
            });

            const prototype = Object.getPrototypeOf(self);
            const properties = target.observedProperties ?
                target.observedProperties ?? [] :
                [ ...Object.getOwnPropertyNames(self),
                    ...Object.getOwnPropertyNames(prototype) ];

            for (const property of properties) {

                if (
                    'attributeChangedCallback' === property ||
                    'disconnectedCallback' === property ||
                    'connectedCallback' === property ||
                    'adoptedCallback' === property ||
                    'constructor' === property ||
                    'template' === property
                ) continue;

                const descriptor = Object.getOwnPropertyDescriptor(self, property) ?? Object.getOwnPropertyDescriptor(prototype, property);

                if (!descriptor) continue;
                if (!descriptor.configurable) continue;

                Object.defineProperty(self, `_${property}`, {
                    ...descriptor,
                    enumerable: false
                });

                Object.defineProperty(self, property, {
                    enumerable: descriptor.enumerable,
                    configurable: descriptor.configurable,
                    get: () => self[ `_${property}` ],
                    set: (value) => {
                        const result = self[ `_${property}` ] = value;
                        self[UPDATE]();
                        return result;
                    }
                });

            }

            console.log(Object.getOwnPropertyNames(self));
            console.log(getOwnPropertyDescriptors(self));

            customElements.upgrade(self);
            customElements.whenDefined(Class.tag).then(()=> self[MOUNT]());
            // setTimeout(()=> self[MOUNT]());
            // self[MOUNT]();

            return self;
        }
    });

    // if (!customElements.get(Class.tag)) {
    //     customElements.define(Class.tag, proxy);
    // }

    return proxy;
}


class XTest extends HTMLElement {
    // static tag = 'x-test';
    // static shadow = true;
    // static observedProperties = ['message'];

    message = 'hello world';

    // #message = 'hello world';
    // get message (){return this.#message};
    // set message (value){ this.#message=value};

    template = () => html`
        <h1>${this.message}</h1>
        <input value=${this.message} oninput=${(e:any)=>this.message=e.target.value} />
    `;
}

component(XTest);

// XTest = ;

// const xtest = new XTest();
// XTest.define();

// const e = XTest.create();
// console.log(e);
// document.body.append(e);

// customElements.define('x-test', component(XTest));
const e = document.createElement('x-test');
// (e as any)[MOUNT]();
setTimeout(()=>{
console.log(e.outerHTML)
document.body.append(e);
},2000);
