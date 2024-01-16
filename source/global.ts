import { Global } from './types';

export const global: Global = (window as any).XGLOBAL ?? ((window as any).XGLOBAL = Object.freeze({

    // QueueNext: undefined,
    // QueueCurrent: undefined,

    BindersCache: new Set(),

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

    // VirtualCache,

    TemplatesCache,
    ContainersCache,

    MarkerSymbol,
    InstanceSymbol,
    TemplateSymbol,
    VariablesSymbol,

} = global;
