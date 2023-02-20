// import Context from './context.ts';
import Schedule from './schedule.ts';
// import Patch from './patch.ts';
import Dash from './dash.ts';

export const $ = Symbol('$');
// const UPGRADE = Symbol('upgrade');

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

export default class Component extends HTMLElement {
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

    static define(name?: string, constructor?: typeof Component) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }

    static defined(name: string) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }

    [$]: any = {};

    #root: any;
    #shadow: ShadowRoot;

    constructor() {
        super();

        this.#shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        // this.#shadow.addEventListener('slotchange', this.slottedCallback.bind(this));

        const context = Reflect.get(this.constructor, 'context');
        const content = Reflect.get(this.constructor, 'content');
        const options = Reflect.get(this.constructor, 'options') ?? {};

        if (options.root === 'this') this.#root = this;
        else if (options.root === 'shadow') this.#root = this.shadowRoot;
        else this.#root = this.shadowRoot;

        if (options.render === undefined) options.render = true;
        if (options.slot === 'default') this.#shadow.appendChild(document.createElement('slot'));

        // this[$].update = async () => {
        //     if (this[$].context.upgrade) await this[$].context.upgrade()?.catch?.(console.error);
        //     Patch(this.#root, this[$].component());
        //     if (this[$].context.upgraded) await this[$].context.upgraded()?.catch(console.error);
        // };

        // this[$].change = async () => {
        //     await Schedule(this.#root, this[$].update);
        // };

        // this[$].context = Context(context(Virtual), this[$].change);
        // this[$].component = component.bind(this[$].context, Virtual, this[$].context);

        // this[$].render = async () => {
        //     if (this.parentNode) {
        //         const cache = RenderCache.get(this.parentNode);
        //         // if (cache && cache !== this[$].context && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
        //         // if (cache && cache !== this[$].context && cache.disconnected) await cache.disconnected()?.catch(console.error);
        //         if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
        //         if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
        //         RenderCache.set(this.parentNode, this[$].context);
        //     }

        //     if (this[$].context.connect) await this[$].context.connect()?.catch?.(console.error);
        //     await Schedule(this.#root, this[$].update);
        //     if (this[$].context.connected) await this[$].context.connected()?.catch(console.error);
        // };

        // if (options.render !== false) {
        //     this[$].render();
        // }
    }

    // async [UPGRADE]() {
    // }

    // async slottedCallback() {
    //     this.dispatchEvent(Component.slottingEvent);
    //     await Reflect.get(this, 'slotted')?.();
    //     this.dispatchEvent(Component.slottedEvent);
    // }

    // async connectedCallback() {
    //     this.dispatchEvent(Component.connectingEvent);
    //     await Reflect.get(this, 'connected')?.();
    //     this.dispatchEvent(Component.connectedEvent);
    // }

    // async disconnectedCallback() {
    //     this.dispatchEvent(Component.disconnectingEvent);
    //     await Reflect.get(this, 'disconnected')?.();
    //     this.dispatchEvent(Component.disconnectedEvent);
    // }

    // async adoptedCallback() {
    //     this.dispatchEvent(Component.adoptingEvent);
    //     await Reflect.get(this, 'adopted')?.();
    //     this.dispatchEvent(Component.adoptedEvent);
    // }

    // async attributeChangedCallback(name: string, from: string, to: string) {
    //     this.dispatchEvent(Component.attributingEvent);
    //     await Reflect.get(this, 'attributed')?.(name, from, to);
    //     this.dispatchEvent(Component.attributedEvent);
    // }
}
