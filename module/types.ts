/**
 * @version 9.1.4
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */

export type Action = (source: any, target: any) => void;
export type Actions = Array<Action>;

export type Expressions = Array<any>;

export type HTML = {
    strings: TemplateStringsArray,
    template: HTMLTemplateElement,
    expressions: Expressions,
    marker: string,
    symbol: symbol,
};

export type Attribute = { name: string, value: string; };

// export type VirtualNode = FragmentNode | ElementNode | AttributeNode | TextNode;
// export type VirtualNode = any;

export type Module = { default: CustomElementConstructor; };
export type Handler = () => Module | CustomElementConstructor | Promise<Module | CustomElementConstructor>;
export type Route = {
    path: string;
    root: Element;
    handler: Handler;
    tag?: string;
    instance?: Element;
    construct?: CustomElementConstructor;
};
