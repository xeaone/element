import { AttributesSymbol, ChildrenSymbol, NameSymbol, ParametersSymbol, TypeSymbol } from './tool.ts';

export type Update = () => void;

export type Item = {
    type: number;
    value?: any;
    [NameSymbol]: string;
    [TypeSymbol]: symbol;
    [ChildrenSymbol]: Array<Item | string>;
    [ParametersSymbol]: Record<string, any>;
    [AttributesSymbol]: Record<string, any>;
};

export type Items = Array<Item>;

export type ContextValue = any;
export type ContextTarget = any;
export type ContextReceiver = any;
export type ContextMethod = () => void;
export type ContextKey = symbol | string;
export type ContextData = Record<string, any>;
