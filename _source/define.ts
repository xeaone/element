import { replaceChildren } from './poly';
import context from './context';
import bind from './bind';
import dash from './dash';

import {
    Internal,
    Instance,
    Component,
} from './types';

import {
    // tag,
    // adopted,
    // attributed,
    // connected,
    // create,
    // created,
    // disconnected,
    internal,
    // render,
    // rendered,
    // state,
    // update,
    // extend,
    // shadow,
} from './symbols';

import {
    createdEvent,
    creatingEvent,

    renderedEvent,
    renderingEvent,

    adoptedEvent,
    adoptingEvent,

    connectedEvent,
    connectingEvent,

    attributedEvent,
    attributingEvent,

    disconnectedEvent,
    disconnectingEvent,
} from './events';

const tick = () => Promise.resolve();

const setupInstance = function (this: Instance) {
    if (this.$internal.setup) return;
    else this.$internal.setup = true;

    const constructor = this.constructor as typeof Component;
    // const observedProperties = constructor.observedProperties;
    const observedProperties = constructor.observedProperties;
    const prototype = Object.getPrototypeOf(this);
    const properties = observedProperties ?
        observedProperties ?? [] :
        [ ...Object.getOwnPropertyNames(this),
        ...Object.getOwnPropertyNames(prototype) ];
    for (const property of properties) {
        if (
            'attributeChangedCallback' === property ||
            'disconnectedCallback' === property ||
            'connectedCallback' === property ||
            'adoptedCallback' === property ||
            'constructor' === property ||
            'disconnected' === property ||
            'attribute' === property ||
            'connected' === property ||
            'rendered' === property ||
            'created' === property ||
            'adopted' === property ||
            'render' === property ||
            'setup' === property
        ) continue;
        const descriptor = Object.getOwnPropertyDescriptor(this, property) ?? Object.getOwnPropertyDescriptor(prototype, property);
        if (!descriptor) continue;
        if (!descriptor.configurable) continue;
        if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);
        if (typeof descriptor.get === 'function') descriptor.get = descriptor.get.bind(this);
        if (typeof descriptor.set === 'function') descriptor.set = descriptor.set.bind(this);
        Object.defineProperty(this.#context, property, descriptor);
        Object.defineProperty(this, property, {
            configurable: false,
            enumerable: descriptor.enumerable,
            // configurable: descriptor.configurable,
            get () {
                return (this.#context as Record<any, any>)[ property ];
            },
            set (value) {
                (this.#context as Record<any, any>)[ property ] = value;
                this[ update ]();
            }
        });
    }

};

const createMethod = async function (this: Instance) {
    this.$internal.created = true;
    this.$internal.queued = true;
    this.$internal.started = true;



    this.dispatchEvent(renderingEvent);

    await this.$state?.(this.$internal.state);

    const template = await this.$render?.(this.$internal.state);
    if (template) {

        // const fragment = document.importNode(template.template.content, true);
        const fragment = template.template.content.cloneNode(true) as DocumentFragment;

        this.$internal.marker = template.marker;
        this.$internal.expressions = template.expressions;

        bind(fragment, this.$internal.actions, this.$internal.marker);

        for (let index = 0; index < this.$internal.actions.length; index++) {
            const newExpression = template.expressions[ index ];
            try {
                this.$internal.actions[ index ](undefined, newExpression);
            } catch (error) {
                console.error(error);
            }
        }

        document.adoptNode(fragment);

        this.$internal.root.appendChild(fragment);
    }

    this.dispatchEvent(creatingEvent);
    await this.$created?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(createdEvent);

    this.dispatchEvent(connectingEvent);
    await this.$connected?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(connectedEvent);

    this.$internal.queued = false;
    this.$internal.started = false;
    this.$internal.restart = false;

    await this.$internal.update();
};

const updateMethod = async function (this: Instance) {

    if (this.$internal.queued && !this.$internal.started) {
        // console.debug('Update: queued and not started');
        return this.$internal.task;
    }

    if (this.$internal.queued && this.$internal.started) {
        // console.debug('Update: queued and started');
        this.$internal.restart = true;
        return this.$internal.task;
    }

    this.$internal.queued = true;
    this.$internal.task = this.$internal.task.then(async () => {
        // console.debug('Update: in progress');
        // await tick();

        this.dispatchEvent(renderingEvent);
        const template = await this.$render?.(this.$internal.state);

        this.$internal.started = true;

        if (template) {
            for (let index = 0; index < this.$internal.actions.length; index++) {

                if (this.$internal.restart) {
                    // console.debug('Update: restart');
                    await tick();
                    index = -1;
                    this.$internal.restart = false;
                    continue;
                }

                const newExpression = template.expressions[ index ];
                const oldExpression = this.$internal.expressions[ index ];

                try {
                    this.$internal.actions[ index ](oldExpression, newExpression);
                } catch (error) {
                    console.error(error);
                }

                this.$internal.expressions[ index ] = template.expressions[ index ];
            }

        }

        this.$internal.queued = false;
        this.$internal.started = false;

        await this.$rendered?.(this.$internal.state)?.catch(console.error);;
        this.dispatchEvent(renderedEvent);

    }).catch(console.error);

    return this.$internal.task;
};

const attributeChangedCallback = async function (this: Instance, name: string, oldValue: string, newValue: string) {
    setupInstance.call(this);
    this.dispatchEvent(attributingEvent);
    await this.$attributed?.(name, oldValue, newValue)?.catch(console.error);
    this.dispatchEvent(attributedEvent);
};

const adoptedCallback = async function (this: Instance) {
    setupInstance.call(this);
    this.dispatchEvent(adoptingEvent);
    await this.$adopted?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(adoptedEvent);
};

const connectedCallback = async function (this: Instance) {
    setupInstance.call(this);
    if (!this.$internal.created) {
        await this.$internal.create();
    } else {
        this.dispatchEvent(connectingEvent);
        await this.$connected?.(this.$internal.state)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }
};

const disconnectedCallback = async function (this: Instance) {
    setupInstance.call(this);
    this.dispatchEvent(disconnectingEvent);
    await this.$disconnected?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(disconnectedEvent);
};

const init = (target: typeof Component, tag: string) => {

    const $tag = dash(tag);

    Object.defineProperties(target, { $tag: { value: $tag } });

    Object.defineProperties(target.prototype, {
        $internal: {
            get() {
                const $shadow = target.$shadow;
                const value: Internal = {
                    setup: false,
                    queued: false,
                    created: false,
                    restart: false,
                    started: false,
                    marker: '',
                    actions: [],
                    expressions: [],
                    task: Promise.resolve(),
                    create: createMethod.bind(this),
                    update: updateMethod.bind(this),
                    state: {},
                    // state: context({}, updateMethod.bind(this)),
                    root: $shadow === 'open' || $shadow === 'closed' ? this.attachShadow({ mode: $shadow }) : this,
                };
                Object.defineProperty(this, '$internal', {
                    value,
                    writable: false,
                    enumerable: false,
                    configurable: false,
                });
                return value;
            }
        },
        // [create]: { value: createMethod },
        // [update]: { value: updateMethod },
        adoptedCallback: { value: adoptedCallback },
        connectedCallback: { value: connectedCallback },
        disconnectedCallback: { value: disconnectedCallback },
        attributeChangedCallback: { value: attributeChangedCallback },
    });

    // if (customElements.get(target.$tag as string) !== (target as any)) {
    const $extend = target.$extend;
    customElements.define($tag as string, (target as any), { extends: $extend });
    // }

    return target;
};

export const define = function (tag: string) {
    return function <T extends typeof Component>(constructor: T, context?: ClassDecoratorContext): T  {
        if (context !== undefined) {
            return context.addInitializer(() => init(constructor, tag)) as unknown as T;
        } else {
            return init(constructor, tag) as unknown as T;
        }
    }
};

export default define;
