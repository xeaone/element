import define from './define';
import render from './render';
import context from './context';
import html from './html';
import dash from './dash';

import {
    HTML,
    Actions,
    Expressions,
} from './types';

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

const task = Symbol('Task');
const create = Symbol('Create');
const setup = Symbol('Setup');
const update = Symbol('Update');

export default class Component extends HTMLElement {

    static html = html;

    static define (tag: string = this.tag ?? this.name) {
        tag = dash(tag);
        define(tag, this);
        return this;
    }

    static async create (tag: string = this.tag ?? this.name) {
        tag = dash(tag);
        define(tag, this);
        const instance = document.createElement(tag);
        await (instance as Component)[ create ];
        return instance;
    }

    declare static tag?: string;
    declare static shadow?: boolean;
    declare static mode?: 'open' | 'closed';
    declare static observedProperties?: Array<string>;

    declare render?: (context: Record<any, any>) => HTML | Promise<HTML>;

    declare created?: (context: Record<any, any>) => void | Promise<void>;
    declare rendered?: (context: Record<any, any>) => void | Promise<void>;
    declare connected?: (context: Record<any, any>) => void | Promise<void>;
    declare adopted?: (context: Record<any, any>) => void | Promise<void>;
    declare disconnected?: (context: Record<any, any>) => void | Promise<void>;
    declare attribute?: (name: string, oldValue: string, newValue: string) => void | Promise<void>;

    #context: Record<any, any> = {};
    #root: Element | ShadowRoot;

    #marker: string = '';
    #actions: Actions = [];
    #expressions: Expressions = [];

    #busy: boolean = false;
    #restart: boolean = false;
    #created: boolean = false;
    [ task ]: Promise<void> = Promise.resolve();

    constructor () {
        super();

        const constructor = this.constructor as typeof Component;
        const shadow = constructor.shadow;
        if (shadow && !this.shadowRoot) {
            const mode = constructor.mode || 'open';
            this.attachShadow({ mode });
        }

        this.#root = this.shadowRoot ?? this;
    }

    async attributeChangedCallback (name: string, oldValue: string, newValue: string) {
        this.dispatchEvent(attributingEvent);
        await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
        this.dispatchEvent(attributedEvent);
    }

    async adoptedCallback () {
        this.dispatchEvent(adoptingEvent);
        await this.adopted?.(this.#context)?.catch(console.error);
        this.dispatchEvent(adoptedEvent);
    }

    async connectedCallback () {
        if (!this.#created) {
            await this[ create ]();
        } else {
            this.dispatchEvent(connectingEvent);
            await this.connected?.(this.#context)?.catch(console.error);
            this.dispatchEvent(connectedEvent);
        }
    }

    async disconnectedCallback () {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

    async [ create ] () {
        this.#created = true;
        this.#busy = true;

        await this[ setup ]();

        this.dispatchEvent(creatingEvent);
        await this.created?.(this.#context);
        this.dispatchEvent(createdEvent);

        this.dispatchEvent(connectingEvent);
        await this.connected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);

        this.#busy = false;
        this.#restart = false;
        await this[ update ]();
    }

    async [ update ] () {

        if (this.#busy) {
            this.#restart = true;
            return this[ task ];
        }

        this.#busy = true;

        this[ task ] = this[ task ].then(async () => {
            // await new Promise((resolve) => {
            // window.requestIdleCallback(async () => {

            this.dispatchEvent(renderingEvent);
            const template = await this.render?.(this.#context);

            if (template) {
                for (let index = 0; index < this.#actions.length; index++) {

                    if (this.#restart) {
                        await Promise.resolve().then().catch(console.error);
                        index = -1;
                        this.#restart = false;
                        continue;
                    }

                    const newExpression = template.expressions[ index ];
                    const oldExpression = this.#expressions[ index ];

                    try {
                        this.#actions[ index ](oldExpression, newExpression);
                    } catch (error) {
                        console.error(error);
                    }

                    this.#expressions[ index ] = template.expressions[ index ];
                }
            }

            this.#busy = false;

            await this.rendered?.(this.#context);
            this.dispatchEvent(renderedEvent);

            // resolve(undefined);
            // });
            // });
        }).catch(console.error);

        return this[ task ];
    }

    async [ setup ] () {

        const constructor = this.constructor as typeof Component;
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
                enumerable: descriptor.enumerable,
                configurable: false,
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

        this.#context = context(this.#context, this[ update ].bind(this));

        // this.dispatchEvent(renderingEvent);

        const template = await this.render?.(this.#context);
        if (template) {

            const fragment = template.template.content.cloneNode(true) as DocumentFragment;
            this.#marker = template.marker;
            this.#expressions = template.expressions;

            render(fragment, this.#actions, this.#marker);

            for (let index = 0; index < this.#actions.length; index++) {
                const newExpression = template.expressions[ index ];
                try {
                    this.#actions[ index ](undefined, newExpression);
                } catch (error) {
                    console.error(error);
                }
            }

            document.adoptNode(fragment);

            this.#root.appendChild(fragment);
        }

        // await this.rendered?.(this.#context);
        // this.dispatchEvent(renderedEvent);

        // this.#restart = false;
        // this.#busy = false;
        // await this[ update ]();

        // this.dispatchEvent(creatingEvent);
        // await this.created?.(this.#context);
        // this.dispatchEvent(createdEvent);
    }

}
