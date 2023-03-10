// import Context from './context';
import Schedule from './schedule';
// import Patch from './patch';
import Dash from './dash';
// import render from './render';
import html from './html';
import observe from './observe';
import { hasOwn, replaceChildren } from './poly';
import { RenderWalk } from './render';

interface ComponentInstance extends HTMLElement {
    attributeChangedCallback?:any;
    disconnectedCallback?:any;
    connectedCallback?:any;
    adoptedCallback?:any;
    template:()=>any;
}

interface ComponentConstructor {

    tag?:string;
    shadow?:boolean;
    observedProperties?: string[];

    create?: typeof create;
    define?: typeof define;
    defined?: typeof defined;

    new (): ComponentInstance;
}

const Expressions = new WeakMap();
const Actions = new WeakMap();
const Busy = new WeakMap();
const Fragment = new WeakMap();
const Root = new WeakMap();

// const DEFINED = new WeakSet();
// const CE = window.customElements;
// Object.defineProperty(window, 'customElements', {
//     get: () => ({
//         define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
//             if (constructor.prototype instanceof Component && !DEFINED.has(constructor)) {
//                 constructor = new Proxy(constructor, {
//                     construct(target, args, extender) {
//                         const instance = Reflect.construct(target, args, extender);
//                             mount(instance);
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


const create = function (this:ComponentConstructor) {
    const tag = this.tag ?? Dash(this.name);

    if (!customElements.get(tag)) {
        customElements.define(tag, this);
    }

    const element = document.createElement(tag) as ComponentInstance;
    mount(element);

    return element;
};

const define = function (this:ComponentConstructor) {
    const tag = this.tag ?? Dash(this.name);
    if (!customElements.get(tag)) return;
    customElements.define(tag, this);
};

const defined = function (this:ComponentConstructor) {
    const tag = this.tag ?? Dash(this.name);
    return customElements.whenDefined(tag);
};

const update = async function (self:ComponentInstance) {

    if (Busy.get(self)) return;
    else Busy.set(self, true);

    // await sleep(50);

    // if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const result = self.template();
    const actions = Actions.get(self) as Array<any>;
    const oldExpressions = Expressions.get(self) as Array<any>;
    const newExpressions = result.expressions as Array<any>;

    const length = actions.length ?? 0;
    for (let index = 0; index < length; index++) {
        actions[index](oldExpressions[index], newExpressions[index]);
    }

    oldExpressions.splice(0, -1, ...newExpressions);

    // if (context.upgraded) await context.upgraded()?.catch(console.error);

    Busy.set(self, false);
};

const mount = async function (self:ComponentInstance) {

    // if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    // if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);

    // if (context.connect) await context.connect()?.catch?.(console.error);
    // if (context.upgrade) await context.upgrade()?.catch?.(console.error);

    const result = self.template();

    const expressions = result.values;
    Expressions.set(self, expressions);

    const fragment = result.template.content.cloneNode(true);
    Fragment.set(self, fragment);

    const actions:any = [];
    Actions.set(self, actions);

    RenderWalk(fragment, expressions, actions);

    document.adoptNode(fragment);

    const length = actions.length;
    for (let index = 0; index < length; index++) {
        actions[index](undefined, expressions[index]);
    }

    const root = Root.get(self);

    replaceChildren(root, fragment);

    // if (context.upgraded) await context.upgraded()?.catch(console.error);
    // if (context.connected) await context.connected()?.catch(console.error);
};

export default function component (Class:ComponentConstructor):ComponentConstructor {
    Class.create = create;
    Class.define = define;
    Class.defined = defined;

    const tag = Class.tag;
    const shadow = Class.shadow;
    const observedProperties = Class.observedProperties;
    const prototype = Class.prototype;

    class Result extends (Class as any) {
        constructor() {
            super();

            const self =  (this as any);

            if (shadow) {
                Root.set(self, self.shadowRoot ?? self.attachShadow({ mode: 'open' }));
            } else {
                Root.set(self, self);
            }

            const properties = observedProperties ?
                observedProperties ?? [] :
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
                    get() {
                        return this[ `_${property}` ];
                    },
                    set(value) {
                        this[ `_${property}` ] = value;
                        update(self);
                    }
                });

            }

            if (tag) {
                customElements.upgrade(self);
                customElements.whenDefined(tag).then(()=> mount(self));
            }

        }
        // async connectedCallback() {
        //     await customElements.whenDefined(tag as string);
        //     mount(this as any);
        //     await super.connectedCallback?.();
        // }
    };

    if (tag && !customElements.get(tag)) {
        customElements.define(tag, Result as ComponentConstructor);
    }

    return Result as ComponentConstructor;
}

component(
class XTest extends HTMLElement {
    static tag = 'x-test';
    // static shadow = true;
    // static observedProperties = ['message'];

    message = 'hello world';

    template = () => html`
        <h1>${this.message}</h1>
        <input value=${this.message} oninput=${(e:any)=>this.message=e.target.value} />
    `;
    connectedCallback(){
        console.log('xtest');
    }
}
);

const e = document.createElement('x-test');

console.log(e.outerHTML)
document.body.append(e);
