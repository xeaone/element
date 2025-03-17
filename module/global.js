/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
export const global = globalThis.XGLOBAL ?? (globalThis.XGLOBAL = Object.freeze({
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
TemplatesCache, ContainersCache, MarkSymbol, ViewSymbol, TemplateSymbol, VariablesSymbol, } = global;
