import { TypeSymbol } from './tool.ts';

export type Update = () => void;

export type Item = {
    name: string;
    type: number;
    [TypeSymbol]: symbol;
    children: Array<Item | string>;
    attributes: Record<string, any>;
};

export type Items = Array<Item>;
