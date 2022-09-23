import XElement from './element.ts';

export type ComputeType = () => any;
export type SetupType = (binder?: any) => void;
export type RenderType = (binder?: any) => void;
export type ResetType = (binder?: any) => void;

export type HandlerType = {
    setup?: SetupType;
    render: RenderType;
    reset: ResetType;
};

export type ElementType = {
    release: (node: Node) => Promise<void>;
    register: (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) => Promise<void>;
};

export type BinderType = {
    name: string;
    value: string;

    node: any;
    owner: any;
    container: ElementType;

    meta: Record<string, any>;
    context: Record<string, any>;
    instance: Record<string, any>;

    setup?: SetupType;
    reset: ResetType;
    render: RenderType;
    handler: HandlerType;
    compute: ComputeType;

    references: Set<string>;
    rewrites: Array<Array<string>>;
};
