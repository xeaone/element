/************************************************************************
Name: XElement
Version: 8.4.0
License: MPL-2.0
Author: Alexander Elias
Email: alex.steven.elis@gmail.com
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
************************************************************************/
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

    protected static html = html;

    /**
     * Defines a custom element.
     */
    protected static define (tag: string = this.tag ?? this.name) {
        tag = dash(tag);
        define(tag, this);
        return this;
    }

    /**
     * Defines a custom element and Creates a element instance.
     */
    protected static async create (tag: string = this.tag ?? this.name) {
        tag = dash(tag);
        define(tag, this);
        const instance = document.createElement(tag) as Component;
        await instance[ create ];
        return instance;
    }

    /**
     * Configuration to define a element Tag name for use by the define() and create() method.
     * Default value will use the function.constructor.name.
     */
    protected static tag?: string;

    /**
     * Configuration to use shadow root.
     * Default is false.
     */
    protected static shadow?: boolean;

    /**
     * Configuration of the shadow mode attachment.
     * Default is open.
     */
    protected static mode?: 'open' | 'closed';

    /**
     * Alternative configuration optimization that allows the specific definition of reactive properties on the Element.
     * Default will use getOwnPropertyNames on the Instance and Prototype to redfine properties as reactive.
     */
    protected static observedProperties?: Array<string>;

    /**
     * Invoked when triggered from reactive properties.
     * @category rendering
     */
    protected render?(context: Record<any, any>): HTML | Promise<HTML>;

    /**
     * Called one time when an element is created. Lifecycle: Created -> Connected -> Rendered.
     * @category lifecycle
     */
    protected created?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element is Connected to a document. Lifecycle: Connected -> Rendered.
     * @category lifecycle
     */
    protected connected?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element is needs to render. Lifecycle: Rendered.
     * @category lifecycle
     */
    protected rendered?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element disconnected from a document.
     * @category lifecycle
     */
    protected disconnected?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element adopted into a new document.
     * @category lifecycle
     */
    protected adopted?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every an observed attribute changes.
     */
    protected attribute?(name: string, oldValue: string, newValue: string): void | Promise<void>;

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

    protected async attributeChangedCallback (name: string, oldValue: string, newValue: string) {
        this.dispatchEvent(attributingEvent);
        await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
        this.dispatchEvent(attributedEvent);
    }

    protected async adoptedCallback () {
        this.dispatchEvent(adoptingEvent);
        await this.adopted?.(this.#context)?.catch(console.error);
        this.dispatchEvent(adoptedEvent);
    }

    protected async connectedCallback () {
        if (!this.#created) {
            await this[ create ]();
        } else {
            this.dispatchEvent(connectingEvent);
            await this.connected?.(this.#context)?.catch(console.error);
            this.dispatchEvent(connectedEvent);
        }
    }

    protected async disconnectedCallback () {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

    protected async [ create ] () {
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

    protected async [ update ] () {

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

    protected async [ setup ] () {

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
