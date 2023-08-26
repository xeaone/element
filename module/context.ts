/**
 * @version 9.1.6
 *
 * @license
 * Copyright (C) Alexander Elias
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @module
 */
type ContextValue = any;
type ContextTarget = any;
type ContextReceiver = any;
type ContextMethod = () => void;
type ContextKey = symbol | string;
type ContextData = Record<string, any>;

// const ContextApply = function (target: ContextTarget, receiver: ContextReceiver, args: any[]) {
//     return Reflect.apply(target, receiver, args);
// };

const ContextSet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, value: ContextValue, receiver: ContextReceiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    Reflect.set(target, key, value, receiver);

    method();

    return true;
};

const ContextGet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, receiver: ContextReceiver): ContextValue {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value) {
        if (value.constructor === Function) {
            // if (typeof value == 'function') {
            return new Proxy(value, {
                apply (t, _, a) {
                    return Reflect.apply(t, receiver, a);
                }
            });
        }

        if (value.constructor === Object || value.constructor === Array) {
            // if (typeof value == 'object') {
            return new Proxy(value, {
                get: ContextGet.bind(null, method),
                set: ContextSet.bind(null, method),
                deleteProperty: ContextDelete.bind(null, method),
            });
        }
    }

    return value;
};

const ContextDelete = function (method: ContextMethod, target: ContextTarget, key: ContextKey) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    Reflect.deleteProperty(target, key);

    method();

    return true;
};

const Context = function (data: ContextData, method: ContextMethod): Record<any, any> {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method),
    });
};

export default Context;
