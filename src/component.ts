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
    connectedEvent,
    connectingEvent,
    disconnectedEvent,
    disconnectingEvent,
} from './events';

export default class Component extends HTMLElement {

    static html = html;
    static tag?: string;
    static shadow: boolean = false;
    static mode: 'open' | 'closed' = 'open';
    static define(tag?: string) {
        tag = dash(tag ?? this.tag ?? this.name);
        define(tag ?? this.tag ?? this.name, this);
    }

    setup?: (context: any) => void | Promise<void>;
    render?: (context: any) => HTML | Promise<HTML>;
    create?: (context: any) => void | Promise<void>;
    change?: (context: any) => void | Promise<void>;
    connect?: (context: any) => void | Promise<void>;
    disconnect?: (context: any) => void | Promise<void>;

    #context: Record<any,any>;

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

        const root = this.shadowRoot ?? this;

        this.#context = context({}, async () => {

            const change = async () => {
                const rendered = await this.render?.(this.#context);

                if (rendered) {
                    for (let index = 0; index < this.#actions.length; index++) {
                        const newExpression = rendered.expressions[ index ];
                        const oldExpression = this.#expressions[ index ];
                        this.#actions[ index ](oldExpression, newExpression);
                        this.#expressions[ index ] = rendered.expressions[ index ];
                    }
                }

                await this.change?.(this.#context);

                this.#changeCurrent = this.#changeNext?.();
                this.#changeNext = undefined;
                await this.#changeCurrent;
            };

            if (this.#changeCurrent) {
                this.#changeNext = change;
            } else {
                this.#changeCurrent = change();
            }

        });

        this.#changeCurrent = Promise.resolve().then(async () => {

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

                root.appendChild(fragment);
            }
            this.dispatchEvent(renderedEvent);

            this.#changeCurrent = this.#changeNext?.();
            this.#changeNext = undefined;
            await this.#changeCurrent;

            this.dispatchEvent(creatingEvent);
            await this.create?.(this.#context);
            this.dispatchEvent(createdEvent);
        });

    }

    async connectedCallback() {
        await this.#changeCurrent;
        this.dispatchEvent(connectingEvent);
        await this.connect?.(this.#context)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }

    async disconnectedCallback() {
        this.dispatchEvent(disconnectingEvent);
        await this.disconnect?.(this.#context)?.catch(console.error);
        this.dispatchEvent(disconnectedEvent);
    }

}