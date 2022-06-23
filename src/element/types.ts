
export type Binder = {
    meta: any;
    container: any;

    compute?: any;

    render?: (binder?: Binder) => void;
    reset?: (binder?: Binder) => void;

    register: any;
    release: any;

    node: any;
    context: any;
    name: string;
    value: string;
    type: string;
    binders: Map<any, any>;
    rewrites: Array<string>;
    references: Array<string>;
    owner: Node | Element | HTMLElement;
};

export type Handler = {
    render: (binder: Binder) => void;
    reset: (binder: Binder) => void;
};

