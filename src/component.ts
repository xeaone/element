import dash from './dash';
import define from './define';
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
import html from './html';
import render from './render';

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
    render?: (ctx: any) => typeof html | Promise<typeof html>;
    connect?: (ctx: any) => void | Promise<void>;
    disconnect?: (ctx: any) => void | Promise<void>;
    // connecting?: (ctx: any) => void | Promise<void>;
    // connected?: (ctx: any) => void | Promise<void>;
    // disconnecting?: (ctx: any) => void | Promise<void>;
    // disconnected?: (ctx: any) => void | Promise<void>;

    #context = {};
    #construct: Promise<void> | null;

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

        this.#construct = Promise.resolve().then(async () => {
            this.dispatchEvent(creatingEvent);
            await this.create?.(this.#context);
            this.dispatchEvent(createdEvent);

            this.dispatchEvent(renderingEvent);

            const { template, expressions } = await this.render?.(this.#context);

            const fragment = template.content.cloneNode(true) as DocumentFragment;
            const actions: any = [];

            render(fragment, expressions, actions);
            document.adoptNode(fragment);

            for (let index = 0; index < actions.length; index++) {
                const newExpression = expressions[index];
                actions[index](undefined, newExpression);
            }

            root.appendChild(fragment as any);
            //update context with render

            this.dispatchEvent(renderedEvent);

            setInterval(async () => {
                // this.render?.(this.#context);

                const result = await this.render?.(this.#context);
                for (let index = 0; index < actions.length; index++) {
                    const newExpression = result.expressions[index];
                    const oldExpressions = expressions[index];
                    actions[index](oldExpressions, newExpression);
                    expressions[index] = newExpression;
                }

            }, 1000);

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