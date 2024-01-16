
// interface Context {
//     update: () => void,
// }

// export type Variable = string | number | Array<any> | Record<any, any> | ((context: Context) => any);

export type Marker = string;

export type Container = string | Element

export type Template = HTMLTemplateElement;

export type Variables = Variable[];

export type Variable = string | number | Array<any> | Record<any, any> | (() => any);

export interface Initialize {
    (container?: string | Element): Element | DocumentFragment
}

export type BinderType = 1 | 2 | 3 | 4;

// export type Reference = WeakRef<Node>

// export type Virtual = {
//     reference: Reference,
//     tag?: string,
//     text?: string,
//     name?: string,
//     value?: any,
// }

export type Results = any[];

export type ReferenceType<T> = {
    data: any,
    get(): T | undefined,
    set(data: T): T | undefined,
}

export interface Binder {

    type: BinderType,
    // index: number,
    // variables: Variables,
    variable: Variable,

    name: any,
    value: any,
    node: Node | undefined,

    source?: any,
    target?: any,

    result?: any,

    // array
    start?: Text, // maybe weakref
    end?: Text,  // maybe weakref
    length?: number,
    markers?: Node[],
    results?: any[],

    remove: () => void,
    add: () => void,
    // replace: (node:Node) => void,

    // reference: Reference,
    // variables: Variables,
    // instructions: Instructions,

    // isOnce: boolean,
    // isReactive: boolean,
    // isInstance: boolean,
    // isInitialized: boolean,

}

export type BindersCache = Set<Binder>;

export type TemplateCache = { template: Template, marker: Marker, };

export type TemplatesCache = WeakMap<TemplateStringsArray, TemplateCache>;

export type ContainersCache = WeakMap<Element, HTMLTemplateElement>;

export interface Global {

    // QueueNext: Promise<void> | undefined,
    // QueueCurrent: Promise<void> | undefined,

    // VirtualCache: WeakMap<Node, Virtual>;
    // ReferenceCache: WeakMap<WeakRef<Node>, WeakSet<Binder>>,
    // NodeCache: WeakMap<Node, symbol>,
    // ReferenceCache: WeakMap<symbol, Node>,

    BindersCache: BindersCache,
    TemplatesCache: TemplatesCache,
    ContainersCache: ContainersCache,

    MarkerSymbol: symbol,
    InstanceSymbol: symbol
    TemplateSymbol: symbol
    VariablesSymbol: symbol,
}

export type Instruction = {
    type: 1 | 2 | 3 | 4,
    index: number,
    data: Record<any, any>,
    source?: any,
};
export type Instructions = Instruction[];