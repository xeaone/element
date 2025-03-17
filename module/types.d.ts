/**
* @version 10.0.3
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
export type Variable = string | number | Array<any> | Record<any, any> | ((event?: any) => any);
export type Marker = string;
export type Container = string | Element | ShadowRoot;
export type Template = HTMLTemplateElement;
export type Variables = Variable[];
export interface Initialize {
    (container?: string | Element | ShadowRoot): Element | ShadowRoot | DocumentFragment;
}
export type Results = any[];
export type ReferenceType<T> = {
    data: any;
    get(): T | undefined;
    set(data: T): T | undefined;
};
export type BinderType = 1 | 2 | 3 | 4;
export interface Binder {
    type: BinderType;
    variable: Variable;
    name: any;
    value: any;
    node: Node | undefined;
    source?: any;
    target?: any;
    result?: any;
    start?: Text;
    end?: Text;
    length?: number;
    markers?: Node[];
    results?: any[];
    add: () => void;
    remove: () => void;
    isInitialized: boolean;
}
export type Bound = WeakMap<Node, Binder>;
export type BindersCache = Set<Binder>;
export type TemplateCache = {
    template: Template;
    marker: Marker;
};
export type TemplatesCache = WeakMap<TemplateStringsArray, TemplateCache>;
export type ContainersCache = WeakMap<Element | ShadowRoot, HTMLTemplateElement>;
export interface Global {
    BindersCache: BindersCache;
    TemplatesCache: TemplatesCache;
    ContainersCache: ContainersCache;
    MarkSymbol: symbol;
    ViewSymbol: symbol;
    TemplateSymbol: symbol;
    VariablesSymbol: symbol;
}
