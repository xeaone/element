
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

export interface Binder {

    // array
    start?: Text, // maybe weakref
    end?: Text,  // maybe weakref
    length?: number,
    markers?: Node[],
    results?: any[],

    result: any,

    // variable: Variable,

    node: Node | null,
    // nodeReference: WeakRef<Node>,

    // owner: Element | null,
    // ownerReference: WeakRef<Element> | undefined,

    remove: () => void,
    // replace: (node:Node) => void,

    variables: Variables,
    references: References,
    instructions: Instructions,

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

    BindersCache: BindersCache,
    TemplatesCache: TemplatesCache,
    ContainersCache: ContainersCache,

    MarkerSymbol: symbol,
    InstanceSymbol: symbol
    TemplateSymbol: symbol
    VariablesSymbol: symbol,
}



export type Reference = WeakRef<Element | Attr | Text>
export type References = Reference[];

export type Instruction = { type: 1 | 2 | 3 | 4, index: number, data: Record<any,any>, }
export type Instructions = Instruction[];