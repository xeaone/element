import { Global } from './types.ts';

export const global: Global = (globalThis as any).XGLOBAL ?? ((globalThis as any).XGLOBAL = Object.freeze({
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

    MarkSymbol: Symbol('mark'),
    ViewSymbol: Symbol('view'),

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

    MarkSymbol,
    ViewSymbol,
    TemplateSymbol,
    VariablesSymbol,
} = global;
