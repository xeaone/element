
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
