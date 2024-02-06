interface Context {
    update: () => void;
    query: () => Element;
}

export type Variable = string | number | Array<any> | Record<any, any> | ((context: Context) => any);
// export type Variable = string | number | Array<any> | Record<any, any> | (() => any);

export type Marker = string;

export type Container = string | Element | ShadowRoot;

export type Template = HTMLTemplateElement;

export type Variables = Variable[];

export interface Initialize {
    (container?: string | Element): Element | DocumentFragment;
}

export type Results = any[];

export type ReferenceType<T> = {
    data: any;
    get(): T | undefined;
    set(data: T): T | undefined;
};

export type BinderType = 1 | 2 | 3 | 4;

export interface Binder {
    type: BinderType;
    variable: Variable;

    name: any;
    value: any;
    node: Node | undefined;

    source?: any;
    target?: any;

    result?: any;

    // array
    start?: Text; // maybe weakref
    end?: Text; // maybe weakref
    length?: number;
    markers?: Node[];
    results?: any[];

    add: () => void;
    remove: () => void;

    // reference: Reference,
    // variables: Variables,

    // isOnce: boolean,
    // isReactive: boolean,
    // isInstance: boolean,
    isInitialized: boolean;
}

export type Bound = WeakMap<Node, Binder>;

export type BindersCache = Set<Binder>;

export type TemplateCache = { template: Template; marker: Marker };

export type TemplatesCache = WeakMap<TemplateStringsArray, TemplateCache>;

export type ContainersCache = WeakMap<Element | ShadowRoot, HTMLTemplateElement>;

export interface Global {
    Bound,
    BindersCache: BindersCache;
    TemplatesCache: TemplatesCache;
    ContainersCache: ContainersCache;

    MarkerSymbol: symbol;
    InstanceSymbol: symbol;
    TemplateSymbol: symbol;
    VariablesSymbol: symbol;
}
