import define from './define';
import render from './render';
import context from './context';
import html from './html';
import dash from './dash';
import { Actions, Expressions, HTML } from './types';
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

export default class Component extends HTMLElement {

    static html = html;
    static tag?: string;
    static shadow: boolean = false;
    static mode: 'open' | 'closed' = 'open';
    static observedProperties?: Array<string>;
    static define(tag?: string) {
        tag = dash(tag ?? this.tag ?? this.name);
        define(tag ?? this.tag ?? this.name, this);
    }

    setup?: (context: Record<any,any>) => void | Promise<void>;
    render?: (context: Record<any, any>) => HTML | Promise<HTML>;

    created?: (context: Record<any,any>) => void | Promise<void>;
    // changed?: (context: Record<any,any>) => void | Promise<void>;
    rendered?: (context: Record<any,any>) => void | Promise<void>;
    connected?: (context: Record<any,any>) => void | Promise<void>;
    adopted?: (context: Record<any,any>) => void | Promise<void>;
    disconnected?: (context: Record<any,any>) => void | Promise<void>;
    attribute?: (name: string, oldValue: string, newValue: string) => void | Promise<void>;

    #context: Record<any,any> = {};
    #root: Element | ShadowRoot;

    #actions: Actions = [];
    #expressions: Expressions = [];

    #changeNext: (()=>Promise<any>) | undefined = undefined;
    #changeCurrent: Promise<any> | undefined = undefined;

    constructor() {
        super();

        const constructor = this.constructor as typeof Component;
        const shadow = constructor.shadow;
        if (shadow && !this.shadowRoot) {
            const mode = constructor.mode;
            this.attachShadow({ mode });
        }

        this.#root = this.shadowRoot ?? this;

        this.#changeCurrent = Promise.resolve().then(() => this.#setup());
    }

    async attributeChangedCallback (name:string, oldValue:string, newValue:string) {
        this.dispatchEvent(attributingEvent);
        await this.attribute?.(name, oldValue, newValue)?.catch(console.error);
        this.dispatchEvent(attributedEvent);
    }

    async adoptedCallback () {
        this.dispatchEvent(adoptingEvent);
        await this.adopted?.(this.#context)?.catch(console.error);
        this.dispatchEvent(adoptedEvent);
    }

    async connectedCallback() {
        await this.#changeCurrent;
        this.dispatchEvent(connectingEvent);
        await this.connected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }

    async disconnectedCallback() {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnected?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

    async #change () {

        const change = async () => {
            this.dispatchEvent(renderingEvent);
            const rendered = await this.render?.(this.#context);

            if (rendered) {
                for (let index = 0; index < this.#actions.length; index++) {
                    const newExpression = rendered.expressions[ index ];
                    const oldExpression = this.#expressions[ index ];
                    this.#actions[ index ](oldExpression, newExpression);
                    this.#expressions[ index ] = rendered.expressions[ index ];
                }
            }

            // await this.changed?.(this.#context);
            await this.rendered?.(this.#context);
            this.dispatchEvent(renderedEvent);

            this.#changeCurrent = this.#changeNext?.();
            this.#changeNext = undefined;
            await this.#changeCurrent;
        };

        if (this.#changeCurrent) {
            this.#changeNext = change;
        } else {
            this.#changeCurrent = change();
        }

    }

    async #setup () {

        const constructor = this.constructor as typeof Component;
        const observedProperties = constructor.observedProperties;
        const prototype = Object.getPrototypeOf(this);
        const properties = observedProperties ?? [];

        // const properties = observedProperties ?
        //     observedProperties ?? [] :
        //     [ ...Object.getOwnPropertyNames(this),
        //         ...Object.getOwnPropertyNames(prototype) ];

        for (const property of properties) {

            if (
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||

                'constructor' === property ||

                'disconnect' === property ||
                'attribute' === property ||
                'connect' === property ||
                'adopted' === property ||
                'change' === property ||
                'create' === property ||
                'render' === property ||
                'setup' === property
            ) continue;

            const descriptor = Object.getOwnPropertyDescriptor(this, property) ?? Object.getOwnPropertyDescriptor(prototype, property);

            if (!descriptor) continue;
            if (!descriptor.configurable) continue;

            Object.defineProperty(this.#context, property, { ...descriptor, enumerable: false });

            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable,
                get: () => (this.#context as Record<any,any>)[property],
                set: (value) => {
                    (this.#context as Record<any, any>)[ property ] = value;
                    this.#change();
                }
            });

        }

        this.#context = context(this.#context, () => this.#change());
        await this.#change();

        await this.setup?.(this.#context);

        this.dispatchEvent(renderingEvent);
        const rendered = await this.render?.(this.#context);
        if (rendered) {

            const fragment = rendered.template.content.cloneNode(true) as DocumentFragment;
            this.#expressions = rendered.expressions;

            render(fragment, this.#expressions, this.#actions);
            document.adoptNode(fragment);

            for (let index = 0; index < this.#actions.length; index++) {
                const newExpression = rendered.expressions[index];
                this.#actions[index](undefined, newExpression);
            }

            this.#root.appendChild(fragment);
        }
        await this.rendered?.(this.#context);
        this.dispatchEvent(renderedEvent);

        this.#changeCurrent = this.#changeNext?.();
        this.#changeNext = undefined;
        await this.#changeCurrent;

        this.dispatchEvent(creatingEvent);
        await this.created?.(this.#context);
        this.dispatchEvent(createdEvent);
    }

}