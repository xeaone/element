export type PathsType = Array<string>;
export type ContextType = Record<any, any>;
export type ComputeType = () => Promise<any> | any;

export type PathType = string;
export type RewritesType = Array<[string, string]>;
export type SetupType = (binder: BinderType) => Promise<any> | any;
export type ResetType = (binder: BinderType) => Promise<any> | any;
export type RenderType = (binder: BinderType) => Promise<any> | any;

export type HandlerType = {
    setup?: SetupType;
    reset: ResetType;
    render: RenderType;
};

export type ElementType = {
    // static observedProperties: Array<>;
    release: (node: Node) => Promise<void>;
    register: (node: Node, context: Record<string, any>, rewrites?: Array<Array<string>>) => Promise<void>;
};

export type BinderType = {
    name: string;
    value: string;
    owner: any;

    promise: Promise<void>;

    // data: any;

    meta: Record<string, any>;
    context: Record<string, any>;
    instance: Record<string, any>;

    setup?: SetupType;
    reset: ResetType;
    render: RenderType;

    paths: PathsType;
    compute: ComputeType;
    binders: BindersType;
    rewrites: RewritesType;
};

export type BindersType = Map<string, Set<BinderType>>;
