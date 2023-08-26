/**
 * @version 9.1.5
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
import render from './render';
import context from './context';
import html from './html';
import dash from './dash';
import { createdEvent, creatingEvent, renderedEvent, renderingEvent, adoptedEvent, adoptingEvent, connectedEvent, connectingEvent, attributedEvent, attributingEvent, disconnectedEvent, disconnectingEvent, } from './events';
const task = Symbol('Task');
const update = Symbol('Update');
const create = Symbol('Create');
const tick = () => Promise.resolve();
export default class Component extends HTMLElement {
    static html = html;
    /**
     * Defines the custom element and return the constructor.
     */
    static define(tag = this.tag ?? this.name) {
        tag = dash(tag);
        if (customElements.get(tag) !== this)
            customElements.define(tag, this);
        return this;
    }
    /**
     * Define, Create, Upgrade, and return element.
     */
    static create(tag) {
        tag = dash(this.tag ?? this.name);
        if (customElements.get(tag) !== this)
            customElements.define(tag, this);
        const instance = document.createElement(tag);
        if (customElements.upgrade)
            customElements.upgrade(instance);
        return instance;
    }
    /**
     * Define, Create, Upgrade, waits until first render, and return element.
     */
    static async upgrade(tag) {
        tag = dash(this.tag ?? this.name);
        if (customElements.get(tag) !== this)
            customElements.define(tag, this);
        const instance = document.createElement(tag);
        await instance[create]();
        if (customElements.upgrade)
            customElements.upgrade(instance);
        return instance;
    }
    /**
     * Configuration to define a element Tag name for use by the define() and create() method.
     * Default value will use the function.constructor.name.
     */
    static tag;
    /**
     * Configuration to use shadow root.
     * Default is false.
     */
    static shadow;
    /**
     * Configuration of the shadow mode attachment.
     * Default is open.
     */
    static mode;
    /**
     * Alternative configuration optimization that allows the specific definition of reactive properties on the Element.
     * Default will use getOwnPropertyNames on the Instance and Prototype to redfine properties as reactive.
     */
    static observedProperties;
    #context = {};
    #root;
    #marker = '';
    #actions = [];
    #expressions = [];
    #queued = false;
    #started = false;
    #restart = false;
    #created = false;
    [task] = Promise.resolve();
    constructor() {
        super();
        const constructor = this.constructor;
        const shadow = constructor.shadow;
        if (shadow && !this.shadowRoot) {
            const mode = constructor.mode || 'open';
            this.attachShadow({ mode });
        }
        this.#root = this.shadowRoot ?? this;
    }
    async attributeChangedCallback(name, oldValue, newValue) {
        this.dispatchEvent(attributingEvent);
        await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
        this.dispatchEvent(attributedEvent);
    }
    async adoptedCallback() {
        this.dispatchEvent(adoptingEvent);
        await this.adopted?.(this.#context)?.catch(console.error);
        this.dispatchEvent(adoptedEvent);
    }
    async connectedCallback() {
        if (!this.#created) {
            await this[create]();
        }
        else {
            this.dispatchEvent(connectingEvent);
            await this.connected?.(this.#context)?.catch(console.error);
            this.dispatchEvent(connectedEvent);
        }
    }
    async disconnectedCallback() {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }
    async [create]() {
        this.#created = true;
        this.#queued = true;
        this.#started = true;
        const constructor = this.constructor;
        const observedProperties = constructor.observedProperties;
        const prototype = Object.getPrototypeOf(this);
        const properties = observedProperties ?
            observedProperties ?? [] :
            [...Object.getOwnPropertyNames(this),
                ...Object.getOwnPropertyNames(prototype)];
        for (const property of properties) {
            if ('attributeChangedCallback' === property ||
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
                'setup' === property)
                continue;
            const descriptor = Object.getOwnPropertyDescriptor(this, property) ?? Object.getOwnPropertyDescriptor(prototype, property);
            if (!descriptor)
                continue;
            if (!descriptor.configurable)
                continue;
            if (typeof descriptor.value === 'function')
                descriptor.value = descriptor.value.bind(this);
            if (typeof descriptor.get === 'function')
                descriptor.get = descriptor.get.bind(this);
            if (typeof descriptor.set === 'function')
                descriptor.set = descriptor.set.bind(this);
            Object.defineProperty(this.#context, property, descriptor);
            Object.defineProperty(this, property, {
                configurable: false,
                enumerable: descriptor.enumerable,
                // configurable: descriptor.configurable,
                get() {
                    return this.#context[property];
                },
                set(value) {
                    this.#context[property] = value;
                    this[update]();
                }
            });
        }
        this.#context = context(this.#context, this[update].bind(this));
        // this.dispatchEvent(renderingEvent);
        const template = await this.render?.(this.#context);
        if (template) {
            // const fragment = document.importNode(template.template.content, true);
            const fragment = template.template.content.cloneNode(true);
            this.#marker = template.marker;
            this.#expressions = template.expressions;
            render(fragment, this.#actions, this.#marker);
            for (let index = 0; index < this.#actions.length; index++) {
                const newExpression = template.expressions[index];
                try {
                    this.#actions[index](undefined, newExpression);
                }
                catch (error) {
                    console.error(error);
                }
            }
            document.adoptNode(fragment);
            this.#root.appendChild(fragment);
        }
        this.dispatchEvent(creatingEvent);
        await this.created?.(this.#context);
        this.dispatchEvent(createdEvent);
        this.dispatchEvent(connectingEvent);
        await this.connected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
        this.#queued = false;
        this.#started = false;
        this.#restart = false;
        await this[update]();
    }
    async [update]() {
        if (this.#queued && !this.#started) {
            // console.debug('Update: queued and not started');
            return this[task];
        }
        if (this.#queued && this.#started) {
            // console.debug('Update: queued and started');
            this.#restart = true;
            return this[task];
        }
        this.#queued = true;
        this[task] = this[task].then(async () => {
            // console.debug('Update: in progress');
            // await tick();
            this.dispatchEvent(renderingEvent);
            const template = await this.render?.(this.#context);
            this.#started = true;
            if (template) {
                for (let index = 0; index < this.#actions.length; index++) {
                    if (this.#restart) {
                        // console.debug('Update: restart');
                        await tick();
                        index = -1;
                        this.#restart = false;
                        continue;
                    }
                    const newExpression = template.expressions[index];
                    const oldExpression = this.#expressions[index];
                    try {
                        this.#actions[index](oldExpression, newExpression);
                    }
                    catch (error) {
                        console.error(error);
                    }
                    this.#expressions[index] = template.expressions[index];
                }
            }
            this.#queued = false;
            this.#started = false;
            await this.rendered?.(this.#context);
            this.dispatchEvent(renderedEvent);
        }).catch(console.error);
        return this[task];
    }
}
//# sourceMappingURL=component.js.map