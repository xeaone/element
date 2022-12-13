export type ContextValue = any;
export type ContextTarget = any;
export type ContextReceiver = any;
export type ContextMethod = () => void;
export type ContextKey = symbol | string;
export type ContextData = Record<string, any>;

export type Property = { name: string; value: any };
export type Properties = Record<string, Property>;

export type TextNode = {
    id: number;
    type: number;
    name: string;
    value: string;
    parent: ElementNode;
};

export type AttributeNode = {
    id: number;
    type: number;
    name: string;
    value: string;
    parent: ElementNode;
};

export type ElementNode = {
    id: number;
    type: number;
    name: string;
    closed: boolean;
    attributes: Array<AttributeNode>;
    parent: FragmentNode | ElementNode;
    children: Array<ElementNode | TextNode>;
};

export type FragmentNode = {
    id: number;
    type: number;
    name: string;
    children: Array<ElementNode | TextNode>;
};

// export type VirtualNode = FragmentNode | ElementNode | AttributeNode | TextNode;
export type VirtualNode = any;
