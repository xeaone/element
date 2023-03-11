import { replaceChildren } from './poly';
import render from './render';
import observe from './observe';
import dash from './dash';

interface ComponentInstance extends HTMLElement {

    // adopted?:any;
    // adopting?:any;
    adoptedCallback?:any;

    upgraded?:any;
    upgrading?:any;
    upgradedCallback?:any;

    connected?:any;
    connecting?:any;
    connectedCallback?:any;

    disconnected?:any;
    disconnecting?:any;
    disconnectedCallback?:any;

    // attributed?:any;
    // attributing?:any;
    attributeChangedCallback?:any;

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

const Components = new WeakMap();

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

const adoptedEvent = new Event('adopted');
const adoptingEvent = new Event('adopting');

const upgradedEvent = new Event('upgraded');
const upgradingEvent = new Event('upgrading');

const connectedEvent = new Event('connected');
const connectingEvent = new Event('connecting');

const attributedEvent = new Event('attributed');
const attributingEvent = new Event('attributing');

const disconnectedEvent = new Event('disconnected');
const disconnectingEvent = new Event('disconnecting');

const create = async function (this:ComponentConstructor) {
    const tag = this.tag ?? dash(this.name);

    if (!customElements.get(tag)) {
        customElements.define(tag, this);
    }

    const element = document.createElement(tag) as ComponentInstance;
    // await mount(element);

    return element;
};

const define = function (this:ComponentConstructor) {
    const tag = this.tag ?? dash(this.name);
    if (!customElements.get(tag)) return;
    customElements.define(tag, this);
};

const defined = async function (this:ComponentConstructor) {
    const tag = this.tag ?? dash(this.name);
    return customElements.whenDefined(tag);
};

const upgrade = async function (self:ComponentInstance) {
    const instance = Components.get(self);

    if (instance.busy) return;
    else instance.busy = true;

    // await sleep(50);
    self.dispatchEvent(upgradingEvent);
    await self.upgrading?.()?.catch(console.error);

    const result = self.template();

    const length = instance.actions.length ?? 0;
    for (let index = 0; index < length; index++) {
        instance.actions[index](instance.expressions[index], result.expressions[index]);
    }

    instance.expressions.splice(0, -1, ...result.expressions);

    instance.busy = false;

    await self.upgraded?.()?.catch(console.error);
    self.dispatchEvent(upgradedEvent);
};

const mount = async function (self:ComponentInstance) {
    const instance = Components.get(self);

    if (instance.mounted) return;
    else instance.mounted = true;

    self.dispatchEvent(upgradingEvent);
    await self.upgrading?.()?.catch(console.error);

    const result = self.template();

    instance.expressions.splice(0, -1, ...result.values);
    instance.fragment = result.template.content.cloneNode(true);

    render(instance.fragment, instance.expressions, instance.actions);

    document.adoptNode(instance.fragment);

    const length = instance.actions.length;
    for (let index = 0; index < length; index++) {
        instance.actions[index](undefined, instance.expressions[index]);
    }

    replaceChildren(instance.root, instance.fragment);

    await self.upgraded?.()?.catch(console.error);
    self.dispatchEvent(upgradedEvent);
};

// const get = function (t:any, k:any, r:any){
//     console.log('get', k);
//     return Reflect.get(t, k, r);
// };

// const set = function (t:any, k:any, v:any, r:any) {
//     console.log('set', k, v);
//     return Reflect.set(t,k,v,r);
// };

const construct = function (t:any, a:any, e:any) {
    const self = Reflect.construct(t, a, e) as ComponentInstance;
    const constructor = self.constructor as ComponentConstructor;

    const shadow = constructor.shadow;
    const tag = constructor.tag ?? dash(constructor.name);
    const observedProperties = constructor.observedProperties;
    const prototype = Object.getPrototypeOf(self);

    const instance:any = {
        tag,
        context: {},
        busy: false,
        actions: [],
        mounted: false,
        expressions: [],
        fragment: undefined,
        shadow: shadow || false,
        root: shadow ?  self.shadowRoot ?? self.attachShadow({ mode: 'open' }) : self
    };

    instance.observed = observe(instance.context, ()=> upgrade(self)),

    Components.set(self, instance);

    const properties = observedProperties ?
        observedProperties ?? [] :
        [ ...Object.getOwnPropertyNames(self),
            ...Object.getOwnPropertyNames(prototype) ];

    for (const property of properties) {

        if (
            'attributeChangedCallback' === property ||
            'attributing' === property ||
            'attributed' === property ||

            'adoptedCallback' === property ||
            'adopting' === property ||
            'adopted' === property ||

            'disconnectedCallback' === property ||
            'disconnecting' === property ||
            'disconnected' === property ||

            'connectedCallback' === property ||
            'connecting' === property ||
            'connected' === property ||

            'upgradedCallback' === property ||
            'upgrading' === property ||
            'upgraded' === property ||

            'constructor' === property ||
            'template' === property

        ) continue;

        const descriptor = Object.getOwnPropertyDescriptor(self, property) ?? Object.getOwnPropertyDescriptor(prototype, property);

        if (!descriptor) continue;
        if (!descriptor.configurable) continue;

        Object.defineProperty(instance.context, property, { ...descriptor, enumerable: false });

        Object.defineProperty(self, property, {
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            get() {
                return instance.observed[property];
            },
            set(value) {
                instance.observed[property] = value;
                // upgrade(self);
            }
        });

    }

    // if (tag) {
        // customElements.upgrade(self);
        // customElements.whenDefined(tag).then(()=> mount(self));
    // }

    return self;
};

export default function component (Class:ComponentConstructor):ComponentConstructor {
    Class.create = create;
    Class.define = define;
    Class.defined = defined;

    const tag = Class.tag ?? dash(Class.name);
    const upgradedCallback = Class.prototype.upgradedCallback;
    const connectedCallback = Class.prototype.connectedCallback;
    const disconnectedCallback = Class.prototype.disconnectedCallback;

    Class.prototype.upgradedCallback = async function () {
        this.dispatchEvent(upgradingEvent);
        await this.upgrading?.();
        await this.upgraded?.();
        this.dispatchEvent(upgradedEvent);
        await upgradedCallback?.();
    };

    Class.prototype.connectedCallback = async function () {
        this.dispatchEvent(connectingEvent);
        await this.connecting?.();
        await mount(this);
        await this.connected?.();
        this.dispatchEvent(connectedEvent);
        await connectedCallback?.();
    };

    Class.prototype.disconnectedCallback = async function () {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnecting?.();
        await this.disconnected?.();
        this.dispatchEvent(disconnectedEvent);
        await disconnectedCallback?.();
    };

    const Wrap = new Proxy(Class, { construct });
    // const Wrap = new Proxy(Class, { get, set, construct });

    if (tag && !customElements.get(tag)) {
        customElements.define(tag, Wrap as any);
    }

    return Wrap;
};

// component(
// class XTest extends HTMLElement {
//     // static tag = 'x-test';
//     // static shadow = true;
//     // static observedProperties = ['message'];

//     message = 'hello world';

//     template = () => html`
//         <h1>${this.message}</h1>
//         <input value=${this.message} oninput=${(e:any)=>this.message=e.target.value} />
//     `;

//     connectedCallback(){console.log('connectedCallback');}
//     disconnectedCallback(){console.log('disconnectedCallback');}
//     connecting(){console.log('connecting');}
//     connected(){console.log('connected');}
//     upgrading(){console.log('upgrading');}
//     upgraded(){console.log('upgraded');}
//     disconnecting(){console.log('disconnecting');}
//     disconnected(){console.log('disconnected');}
// }
// );

// const e = document.createElement('x-test');
// console.log(e.outerHTML);
// document.body.append(e);
