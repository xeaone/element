import { TypeSymbol } from './tool.ts';

export type Update = () => void;

export type Item = {
    name: string;
    type: number;
    value?: any;
    [TypeSymbol]: symbol;
    children: Array<Item | string>;
    attributes: Record<string, any>;
};

export type Items = Array<Item>;

export type ContextValue = any;
export type ContextTarget = any;
export type ContextReceiver = any;
export type ContextMethod = () => void;
export type ContextKey = symbol | string;
export type ContextData = Record<string, any>;
