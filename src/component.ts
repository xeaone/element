import dash from './dash';
import define from './define';
import render from './render';
import { Actions, Expressions, HTML } from './types';
import {
    createdEvent,
    creatingEvent,
    renderedEvent,
    renderingEvent,
    connectedEvent,
    connectingEvent,
    disconnectedEvent,
    disconnectingEvent,
} from './events';
import context from './context';

export default class Component extends HTMLElement {

    static tag?: string;
    static shadow: boolean = false;
    static mode: 'open' | 'closed' = 'open';

    static define(tag?: string) {
        tag = dash(tag ?? this.tag ?? this.name);
        define(tag ?? this.tag ?? this.name, this);
    }

    // construct?: (ctx: any) => void | Promise<void>;
    // upgrade?: (ctx: any) => void | Promise<void>;
    create?: (ctx: any) => void | Promise<void>;
    render?: (ctx: any) => HTML | Promise<HTML>;
    connect?: (ctx: any) => void | Promise<void>;
    disconnect?: (ctx: any) => void | Promise<void>;
    // connecting?: (ctx: any) => void | Promise<void>;
    // connected?: (ctx: any) => void | Promise<void>;
    // disconnecting?: (ctx: any) => void | Promise<void>;
    // disconnected?: (ctx: any) => void | Promise<void>;

    #context:Record<any,any>;
    #construct: Promise<void> | null;

    #actions: Actions = [];
    #expressions: Expressions = [];

    constructor() {
        super();

        if (!customElements.get('x-test')) {
            customElements.define('x-test', this as any);
        }

        const constructor = this.constructor as typeof Component;

        const shadow = constructor.shadow;
        if (shadow && !this.shadowRoot) {
            const mode = constructor.mode;
            this.attachShadow({ mode });
        }

        const root = this.shadowRoot ?? this;

        // create context
        this.#context = context({}, async () => {
            if (this.#construct) return;
            const rendered = await this.render?.(this.#context);
            if (rendered) {
                for (let index = 0; index < this.#actions.length; index++) {
                    const newExpression = rendered.expressions[index];
                    const oldExpression = this.#expressions[index];
                    this.#actions[index](oldExpression, newExpression);
                    this.#expressions[index] = rendered.expressions[index];
                }
            }
        });

        this.#construct = Promise.resolve().then(async () => {
            this.dispatchEvent(creatingEvent);
            await this.create?.(this.#context);
            this.dispatchEvent(createdEvent);

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

                root.appendChild(fragment);
            }

            this.dispatchEvent(renderedEvent);

            // setInterval(async () => {
            //     // this.render?.(this.#context);

            //     const result = await this.render?.(this.#context);
            //     for (let index = 0; index < actions.length; index++) {
            //         const newExpression = result.expressions[index];
            //         const oldExpressions = expressions[index];
            //         actions[index](oldExpressions, newExpression);
            //         expressions[index] = newExpression;
            //     }

            // }, 1000);

            this.#construct = null;
        });
    }

    async connectedCallback() {
        this.dispatchEvent(connectingEvent);
        if (this.#construct) await this.#construct;
        await this.connect?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }

    async disconnectedCallback() {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnect?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

}