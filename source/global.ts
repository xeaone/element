import { Global } from './types.ts';

export const global: Global = (window as any).XGLOBAL ?? ((window as any).XGLOBAL = Object.freeze({
    // QueueNext: undefined,
    // QueueCurrent: undefined,

    Bound: new WeakMap(),
    BindersCache: new Set(),

    // GlobalBinders: new Set(),
    // LocalBinders: new Set(),
    // QueueBinders: new Set(),

    // VirtualCache: new WeakMap(),

    TemplatesCache: new WeakMap(),
    ContainersCache: new WeakMap(),

    MarkerSymbol: Symbol('marker'),
    InstanceSymbol: Symbol('instance'),
    TemplateSymbol: Symbol('template'),
    VariablesSymbol: Symbol('variables'),

}));

export const {
    // QueueNext,
    // QueueCurrent,

    BindersCache,

    // GlobalBinders,
    // LocalBinders,
    // QueueBinders,

    // VirtualCache,

    TemplatesCache,
    ContainersCache,

    MarkerSymbol,
    InstanceSymbol,
    TemplateSymbol,
    VariablesSymbol,
} = global;
