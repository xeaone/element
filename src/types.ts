
export type Value = any;

export type OldValue = Value;
export type NewValue = Value;

export type Action = (...args:any) => void;
// export type Action = (node: Node, oldValue:OldValue, newValue:NewValue) => void;
export type Actions = Array<Action>;

export type Expressions =  Array<Value>;

export type HTML =  {
    strings: TemplateStringsArray,
    template: HTMLTemplateElement,
    expressions: Expressions,
    symbol: symbol,
};

export type Attribute = { name: string, value: string };

// export type VirtualNode = FragmentNode | ElementNode | AttributeNode | TextNode;
export type VirtualNode = any;
export type Module = { default: CustomElementConstructor }
export type Handler = () => Module | CustomElementConstructor | Promise<Module | CustomElementConstructor>;
export type Route = {
    path: string;
    root: Element;
    handler: Handler;
    tag?: string;
    instance?: Element;
    construct?: CustomElementConstructor;
};