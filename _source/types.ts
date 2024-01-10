import { attributed, adopted, connected, created, disconnected, internal, render, rendered, tag, state, create, update, extend, shadow } from './symbols';

export type Action = (source: any, target: any) => void;
export type Actions = Array<Action>;

export type Expressions = Array<any>;

export type HTML = {
    strings: TemplateStringsArray,
    template: HTMLTemplateElement,
    expressions: Expressions,
    marker: string,
    symbol: symbol,
};

export type Attribute = { name: string, value: string; };

// export type VirtualNode = FragmentNode | ElementNode | AttributeNode | TextNode;
// export type VirtualNode = any;

export type Module = { default: CustomElementConstructor; };
export type Handler = () => Module | CustomElementConstructor | Promise<Module | CustomElementConstructor>;
export type Route = {
    path: string;
    root: Element;
    handler: Handler;
    tag?: string;
    instance?: Element;
    construct?: CustomElementConstructor;
};

export type Shadow = 'open' | 'closed' | 'none';

export type DefineInit = string | {
    tag?: string,
    extend?: string,
    shadow?: Shadow,
}

export type MountInit = string | {
    selector?: string,
}

export type Internal = {
    setup: boolean,
    queued: boolean,
    created: boolean,
    restart: boolean,
    started: boolean,
    marker: string,
    actions: Actions,
    expressions: Expressions,
    task: Promise<void>,
    state: Record<any,any>,
    root: Element | ShadowRoot,

    create: () => Promise<void>,
    update: () => Promise<void>,
}

export abstract class Component extends HTMLElement {

    /**
     * The tag name.
     */
    static readonly $tag?: string;

    /**
     * A shdow of open, closed, or none (which does not use shadow) defaults to open.
     */
    static readonly  $shadow?: Shadow;

    /**
     * A selector that mounts an instance of the element.
     */
    static $mount?: string;

    /**
     * A tag name to extend.
     */
    static $extend?: string;

    // abstract $state <S extends any>(state: S): void | Promise<void>;
    abstract $state: (state: Record<any,any> | any) => void | Promise<void>;

    /**
     * Invoked when triggered from reactive properties.
     * @category rendering
     */
    // abstract $render<S extends any>(state: S): HTML | Promise<HTML>;
    abstract $render: (state: Record<any,any> | any) => HTML | Promise<HTML>;

    /**
     * Called one time when an element is created. cycle: Created -> Connected -> Rendered.
     * @category lifecycle
     */
    $created?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element is Connected to a document. cycle: Connected -> Rendered.
     * @category lifecycle
     */
    $connected?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element is needs to render. cycle: Rendered.
     * @category lifecycle
     */
    $rendered?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element disconnected from a document.
     * @category lifecycle
     */
    $disconnected?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every time the element adopted into a new document.
     * @category lifecycle
     */
    $adopted?(context: Record<any, any>): void | Promise<void>;

    /**
     * Called every an observed attribute changes.
     */
    $attributed?(name: string, from: string, to: string): void | Promise<void>;

};

export interface Instance extends Component {
    readonly $internal: Internal;

    /**
     * Invoked once on connectedCallback.
     */
    readonly [ create ]: () => Promise<void>;

    /**
     * Invoked every state change callback.
     */
    readonly [ update ]: () => Promise<void>;
}