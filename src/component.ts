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

const next = Promise.resolve();
const changeSymbol = Symbol('change');

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
        await (instance as Component)[ changeSymbol ];
        return instance;
    }

    declare static tag?: string;
    declare static shadow?: boolean;
    declare static mode?: 'open' | 'closed';
    declare static observedProperties?: Array<string>;

    // declare setup?: (context: Record<any, any>) => void | Promise<void>;
    declare render?: (context: Record<any, any>) => HTML | Promise<HTML>;

    declare created?: (context: Record<any, any>) => void | Promise<void>;
    declare rendered?: (context: Record<any, any>) => void | Promise<void>;
    declare connected?: (context: Record<any, any>) => void | Promise<void>;
    declare adopted?: (context: Record<any, any>) => void | Promise<void>;
    declare disconnected?: (context: Record<any, any>) => void | Promise<void>;
    declare attribute?: (name: string, oldValue: string, newValue: string) => void | Promise<void>;

    #isCreatingOrCreated: boolean = false;

    #context: Record<any, any> = {};
    #root: Element | ShadowRoot;

    #marker: string = '';
    #actions: Actions = [];
    #expressions: Expressions = [];

    #changeBusy: boolean = false;
    #changeRestart: boolean = false;
    [ changeSymbol ]: Promise<void> = Promise.resolve();

    constructor () {
        super();

        const constructor = this.constructor as typeof Component;
        const shadow = constructor.shadow;
        if (shadow && !this.shadowRoot) {
            const mode = constructor.mode || 'open';
            this.attachShadow({ mode });
        }

        this.#root = this.shadowRoot ?? this;
        // this.[changeSymbol].then(() => this.#setup());
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

        if (!this.#isCreatingOrCreated) {
            this.#isCreatingOrCreated = true;
            this.#changeBusy = true;
            await this.#setup();
        }

        this.dispatchEvent(connectingEvent);
        await this.connected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }

    async disconnectedCallback () {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

    async #change () {

        if (this.#changeBusy) {
            this.#changeRestart = true;
            return;
        }

        this.#changeBusy = true;

        const change = async () => {
            this.dispatchEvent(renderingEvent);
            const template = await this.render?.(this.#context);

            if (template) {
                for (let index = 0; index < this.#actions.length; index++) {

                    if (this.#changeRestart) {
                        await new Promise(resolve => setTimeout(resolve, 60));
                        // await new Promise(resolve => requestAnimationFrame(resolve));
                        // await new Promise(resolve => requestIdleCallback(resolve));

                        index = -1;
                        this.#changeRestart = false;
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

            this.#changeBusy = false;
            // console.log('change done');

            await this.rendered?.(this.#context);
            this.dispatchEvent(renderedEvent);
        };

        // requestAnimationFrame(() => {
        // requestIdleCallback(() => {
        setTimeout(() => {
            this[ changeSymbol ] = this[ changeSymbol ].then(change);
        }, 60);
        // });

    }

    async #setup () {

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
                    this.#change();
                }
            });

        }

        this.#context = context(this.#context, this.#change.bind(this));

        this.dispatchEvent(renderingEvent);

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

        await this.rendered?.(this.#context);
        this.dispatchEvent(renderedEvent);

        this.#changeRestart = false;
        this.#changeBusy = false;
        this.#change();
        await this[ changeSymbol ];

        this.dispatchEvent(creatingEvent);
        await this.created?.(this.#context);
        this.dispatchEvent(createdEvent);
    }

}
