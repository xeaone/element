
/*!
    Name: oxe
    Version: 6.0.6
    License: MPL-2.0
    Author: Alexander Elias
    Email: alex.steven.elis@gmail.com
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Oxe = factory());
})(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }

    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    const get = function (task, path, target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (value && typeof value === 'object') {
            path = path ? `${path}.${key}` : `${key}`;
            return new Proxy(value, {
                get: get.bind(null, task, path),
                set: set.bind(null, task, path),
                deleteProperty: deleteProperty.bind(null, task, path)
            });
        }
        else {
            return value;
        }
    };
    const deleteProperty = function (task, path, target, key, receiver) {
        Reflect.deleteProperty(target, key);
        task(path ? `${path}.${key}` : `${key}`, 'unrender');
    };
    const set = function (task, path, target, key, to, receiver) {
        const from = Reflect.get(target, key, receiver);
        if (key === 'length') {
            task(path, 'render');
            task(path ? `${path}.${key}` : `${key}`, 'render');
            return true;
        }
        else if (from === to) {
            return true;
        }
        Reflect.set(target, key, to, receiver);
        // console.log(path, key, from, to);
        // if (from && typeof from === 'object') {
        //     if (to && typeof to === 'object') {
        //         const tasks = [];
        //         for (const child in from) {
        //             if (!(child in to)) {
        //                 tasks.push(task(path ? `${path}.${key}.${child}` : `${key}.${child}`, 'unrender'));
        //             }
        //         }
        //         Promise.all(tasks).then(() => task(path ? `${path}.${key}` : `${key}`, 'render'));
        //     } else {
        //         task(path ? `${path}.${key}` : `${key}`, 'unrender').then(() => task(path ? `${path}.${key}` : `${key}`, 'render'));
        //     }
        // } else {
        //     task(path ? `${path}.${key}` : `${key}`, 'render');
        // }
        task(path ? `${path}.${key}` : `${key}`, 'render');
        return true;
    };
    const observer = function (source, task, path = '') {
        return new Proxy(source, {
            get: get.bind(null, task, path),
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });
    };

    var booleanTypes = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];

    const format = (data) => data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;

    const standardRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield binder.compute();
            const boolean = booleanTypes.includes(binder.name);
            binder.node.value = '';
            if (boolean) {
                data = data ? true : false;
                if (data)
                    binder.owner.setAttributeNode(binder.node);
                else
                    binder.owner.removeAttribute(binder.name);
            }
            else {
                data = format(data);
                binder.owner[binder.name] = data;
                binder.owner.setAttribute(binder.name, data);
            }
        });
    };
    const standardUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            const boolean = booleanTypes.includes(binder.name);
            if (boolean) {
                binder.owner.removeAttribute(binder.name);
            }
            else {
                binder.owner.setAttribute(binder.name, '');
            }
        });
    };
    var standard = { render: standardRender, unrender: standardUnrender };

    const flag = Symbol('RadioFlag');
    const handler = function (binder, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const checked = binder.owner.checked;
            const computed = yield binder.compute({ $event: event, $checked: checked, $assignment: !!event });
            if (computed) {
                binder.owner.setAttributeNode(binder.node);
            }
            else {
                binder.owner.removeAttribute('checked');
            }
        });
    };
    const checkedRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!binder.meta.setup) {
                binder.node.value = '';
                binder.meta.setup = true;
                if (binder.owner.type === 'radio') {
                    binder.owner.addEventListener('input', (event) => __awaiter(this, void 0, void 0, function* () {
                        if (event.detail === flag)
                            return handler(binder, event);
                        const parent = binder.owner.form || binder.owner.getRootNode();
                        const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                        const input = new CustomEvent('input', { detail: flag });
                        for (const radio of radios) {
                            if (radio === event.target) {
                                yield handler(binder, event);
                            }
                            else {
                                let checked;
                                const bounds = binder.binder.ownerBinders.get(binder.owner);
                                if (bounds) {
                                    for (const bound of bounds) {
                                        if (bound.name === 'checked') {
                                            checked = bound;
                                            break;
                                        }
                                    }
                                }
                                if (checked) {
                                    radio.dispatchEvent(input);
                                }
                                else {
                                    radio.checked = !event.target.checked;
                                    if (radio.checked) {
                                        radio.setAttribute('checked', '');
                                    }
                                    else {
                                        radio.removeAttribute('checked');
                                    }
                                }
                            }
                        }
                    }));
                }
                else {
                    binder.owner.addEventListener('input', event => handler(binder, event));
                }
            }
            yield handler(binder);
        });
    };
    const checkedUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            binder.owner.removeAttribute('checked');
        });
    };
    var checked = { render: checkedRender, unrender: checkedUnrender };

    const inheritRender = function (binder) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!binder.meta.setup) {
                binder.meta.setup = true;
                binder.node.value = '';
            }
            if (!binder.owner.inherited) {
                return console.warn(`inherited not implemented ${binder.owner.localName}`);
            }
            const inherited = yield binder.compute();
            (_b = (_a = binder.owner).inherited) === null || _b === void 0 ? void 0 : _b.call(_a, inherited);
        });
    };
    const inheritUnrender = function (binder) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!binder.owner.inherited) {
                return console.warn(`inherited not implemented ${binder.owner.localName}`);
            }
            (_b = (_a = binder.owner).inherited) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
    };
    var inherit = { render: inheritRender, unrender: inheritUnrender };

    var dateTypes = ['date', 'datetime-local', 'month', 'time', 'week'];

    console.warn('value: setter/getter issue with multiselect');
    const defaultInputEvent = new Event('input');
    const parseable = function (value) {
        return !isNaN(value) && value !== null && value !== undefined && typeof value !== 'string';
    };
    const stampFromView = function (data) {
        const date = new Date(data);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
    };
    const stampToView = function (data) {
        const date = new Date(data);
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
    };
    const input = function (binder, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owner } = binder;
            const { type } = owner;
            let display, computed;
            if (type === 'select-one') {
                const [option] = owner.selectedOptions;
                const value = option ? '$value' in option ? option.$value : option.value : undefined;
                computed = yield binder.compute({ $event: event, $value: value, $assignment: true });
                display = format(computed);
            }
            else if (type === 'select-multiple') {
                const value = [];
                for (const option of owner.selectedOptions) {
                    value.push('$value' in option ? option.$value : option.value);
                }
                computed = yield binder.compute({ $event: event, $value: value, $assignment: true });
                display = format(computed);
            }
            else if (type === 'number' || type === 'range') {
                computed = yield binder.compute({ $event: event, $value: owner.valueAsNumber, $assignment: true });
                // if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
                // else owner.value = computed;
                owner.value = computed;
                display = owner.value;
            }
            else if (dateTypes.includes(type)) {
                const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
                computed = yield binder.compute({ $event: event, $value: value, $assignment: true });
                if (typeof owner.$value === 'string')
                    owner.value = computed;
                else
                    owner.valueAsNumber = stampToView(computed);
                display = owner.value;
            }
            else {
                const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
                const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
                computed = yield binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
                display = format(computed);
                owner.value = display;
            }
            owner.$value = computed;
            if (type === 'checked' || type === 'radio')
                owner.$checked = computed;
            owner.setAttribute('value', display);
        });
    };
    const valueRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            const { owner, meta } = binder;
            if (!meta.setup) {
                meta.setup = true;
                owner.addEventListener('input', event => input(binder, event));
            }
            const computed = yield binder.compute();
            let display;
            if (binder.owner.type === 'select-one') {
                owner.value = undefined;
                for (const option of owner.options) {
                    const optionValue = '$value' in option ? option.$value : option.value;
                    if (option.selected = optionValue === computed)
                        break;
                }
                if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
                    const [option] = owner.options;
                    option.selected = true;
                    return owner.dispatchEvent(defaultInputEvent);
                }
                display = format(computed);
                owner.value = display;
            }
            else if (binder.owner.type === 'select-multiple') {
                for (const option of owner.options) {
                    const optionValue = '$value' in option ? option.$value : option.value;
                    option.selected = computed === null || computed === void 0 ? void 0 : computed.includes(optionValue);
                }
                display = format(computed);
            }
            else if (binder.owner.type === 'number' || binder.owner.type === 'range') {
                if (typeof computed === 'number' && computed !== Infinity)
                    owner.valueAsNumber = computed;
                else
                    owner.value = computed;
                display = owner.value;
            }
            else if (dateTypes.includes(binder.owner.type)) {
                if (typeof computed === 'string')
                    owner.value = computed;
                else
                    owner.valueAsNumber = stampToView(computed);
                display = owner.value;
            }
            else {
                display = format(computed);
                owner.value = display;
            }
            owner.$value = computed;
            if (binder.owner.type === 'checked' || binder.owner.type === 'radio')
                owner.$checked = computed;
            owner.setAttribute('value', display);
        });
    };
    const valueUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            if (binder.owner.type === 'select-one' || binder.owner.type === 'select-multiple') {
                for (const option of binder.owner.options) {
                    option.selected = false;
                }
            }
            binder.owner.value = undefined;
            binder.owner.$value = undefined;
            if (binder.owner.type === 'checked' || binder.owner.type === 'radio')
                binder.owner.$checked = undefined;
            binder.owner.setAttribute('value', '');
        });
    };
    var value = { render: valueRender, unrender: valueUnrender };

    const space = /\s+/;
    const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;
    // const nextFrame = async function () {
    //     return new Promise((resolve: any) =>
    //         window.requestAnimationFrame(() =>
    //             window.requestAnimationFrame(() => resolve())
    //         )
    //     );
    // };
    const wait = function () {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(() => resolve(), 0));
        });
    };
    const eachHas = function (binder, indexValue, keyValue, target, key) {
        return key === binder.meta.variableName ||
            key === binder.meta.indexName ||
            key === binder.meta.keyName ||
            key in target;
    };
    const eachGet = function (binder, indexValue, keyValue, target, key) {
        if (key === binder.meta.variableName) {
            let result = binder.context;
            for (const part of binder.meta.parts) {
                result = result[part];
                if (!result)
                    return;
            }
            return typeof result === 'object' ? result[keyValue] : undefined;
        }
        else if (key === binder.meta.indexName) {
            return indexValue;
        }
        else if (key === binder.meta.keyName) {
            return keyValue;
        }
        else {
            return binder.context[key];
        }
    };
    const eachSet = function (binder, indexValue, keyValue, target, key, value) {
        if (key === binder.meta.variableName) {
            let result = binder.context;
            for (const part of binder.meta.parts) {
                result = result[part];
                if (!result)
                    return true;
            }
            typeof result === 'object' ? result[keyValue] = value : undefined;
        }
        else if (key === binder.meta.indexName || key === binder.meta.keyName) {
            return true;
        }
        else {
            binder.context[key] = value;
        }
        return true;
    };
    const eachUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            binder.meta.tasks = [];
            binder.meta.targetLength = 0;
            binder.meta.currentLength = 0;
            return Promise.all([
                (() => __awaiter(this, void 0, void 0, function* () {
                    let node;
                    while (node = binder.owner.lastChild)
                        binder.binder.remove(binder.owner.removeChild(node));
                }))(),
                (() => __awaiter(this, void 0, void 0, function* () {
                    let node;
                    while (node = binder.meta.queueElement.content.lastChild)
                        binder.meta.queueElement.content.removeChild(node);
                }))()
            ]);
        });
    };
    const eachRender = function (binder) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!binder.meta.setup) {
                binder.node.value = '';
                const [path, variable, index, key] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();
                binder.meta.path = path;
                binder.meta.keyName = key;
                binder.meta.indexName = index;
                binder.meta.parts = path.split('.');
                binder.meta.variableName = variable;
                binder.meta.variableNamePattern = new RegExp(`([^.a-zA-Z0-9$_\\[\\]])(${variable})\\b`);
                // binder.meta.variableNamePattern = new RegExp(`^${variable}\\b`);
                binder.meta.keys = [];
                binder.meta.tasks = [];
                binder.meta.setup = true;
                binder.meta.targetLength = 0;
                binder.meta.currentLength = 0;
                binder.meta.templateLength = 0;
                binder.meta.queueElement = document.createElement('template');
                binder.meta.templateElement = document.createElement('template');
                let node = binder.owner.firstChild;
                while (node) {
                    if (space.test(node.nodeValue)) {
                        binder.owner.removeChild(node);
                    }
                    else {
                        binder.meta.templateLength++;
                        binder.meta.templateElement.content.appendChild(node);
                    }
                    node = binder.owner.firstChild;
                }
            }
            const data = yield binder.compute();
            if ((data === null || data === void 0 ? void 0 : data.constructor) === Array) {
                binder.meta.targetLength = data.length;
            }
            else {
                binder.meta.keys = Object.keys(data || {});
                binder.meta.targetLength = binder.meta.keys.length;
            }
            if (binder.meta.currentLength > binder.meta.targetLength) {
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;
                    while (count--) {
                        const node = binder.owner.lastChild;
                        binder.owner.removeChild(node);
                        binder.meta.tasks.push(binder.binder.remove(node));
                    }
                    binder.meta.currentLength--;
                }
            }
            else if (binder.meta.currentLength < binder.meta.targetLength) {
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const indexValue = binder.meta.currentLength;
                    const keyValue = (_a = binder.meta.keys[binder.meta.currentLength]) !== null && _a !== void 0 ? _a : binder.meta.currentLength;
                    const variableValue = `${binder.meta.path}.${(_b = binder.meta.keys[binder.meta.currentLength]) !== null && _b !== void 0 ? _b : binder.meta.currentLength}`;
                    const context = new Proxy(binder.context, {
                        has: eachHas.bind(null, binder, indexValue, keyValue),
                        get: eachGet.bind(null, binder, indexValue, keyValue),
                        set: eachSet.bind(null, binder, indexValue, keyValue),
                    });
                    const rewrites = ((_c = binder.rewrites) === null || _c === void 0 ? void 0 : _c.slice()) || [];
                    if (binder.meta.keyName)
                        rewrites.unshift([binder.meta.keyName, keyValue]);
                    // if (binder.meta.indexName) rewrites.unshift([ binder.meta.indexName, indexValue ]);
                    // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableName, variableValue ]);
                    if (binder.meta.variableName)
                        rewrites.unshift([binder.meta.variableNamePattern, variableValue]);
                    const clone = binder.meta.templateElement.content.cloneNode(true);
                    let node = clone.firstChild;
                    if (node) {
                        do {
                            binder.meta.tasks.push(binder.binder.add(node, binder.container, context, rewrites));
                        } while (node = node.nextSibling);
                    }
                    binder.meta.queueElement.content.appendChild(clone);
                    // var d = document.createElement('div');
                    // d.classList.add('box');
                    // var t = document.createTextNode('{{item.number}}');
                    // binder.meta.tasks.push(binder.binder.add(t, binder.container, context, rewrites));
                    // d.appendChild(t);
                    // binder.meta.queueElement.content.appendChild(d);
                    binder.meta.currentLength++;
                }
            }
            if (binder.meta.currentLength === binder.meta.targetLength) {
                yield Promise.all(binder.meta.tasks.splice(0, binder.meta.length - 1));
                binder.owner.appendChild(binder.meta.queueElement.content);
                yield wait();
            }
            if (binder.owner.nodeName === 'SELECT') {
                (_d = binder.binder.nodeBinders.get(binder.owner.attributes['value'])) === null || _d === void 0 ? void 0 : _d.render();
            }
        });
    };
    var each = { render: eachRender, unrender: eachUnrender };

    const htmlRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = [];
            let data = yield binder.compute();
            if (typeof data !== 'string') {
                data = '';
                console.warn('html binder requires a string');
            }
            let removeChild;
            while (removeChild = binder.owner.lastChild) {
                binder.owner.removeChild(removeChild);
                tasks.push(binder.binder.remove(removeChild));
            }
            const template = document.createElement('template');
            template.innerHTML = data;
            let addChild = template.content.firstChild;
            while (addChild) {
                tasks.push(binder.binder.add.bind(binder.binder, addChild, binder.container));
                addChild = addChild.nextSibling;
            }
            yield Promise.all(tasks);
            binder.owner.appendChild(template.content);
        });
    };
    const htmlUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = [];
            let node;
            while (node = binder.owner.lastChild) {
                tasks.push(binder.binder.remove(node));
                binder.owner.removeChild(node);
            }
            yield Promise.all(tasks);
        });
    };
    var html = { render: htmlRender, unrender: htmlUnrender };

    const textRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield binder.compute();
            binder.owner.textContent = format(data);
        });
    };
    const textUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            binder.owner.textContent = '';
        });
    };
    var text = { render: textRender, unrender: textUnrender };

    const Value = function (element) {
        if (!element)
            return undefined;
        else if ('$value' in element)
            return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
        else if (element.type === 'number' || element.type === 'range')
            return element.valueAsNumber;
        else
            return element.value;
    };
    const submit = function (event, binder) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const form = {};
            const target = event.target;
            // const elements = target?.elements || target?.form?.elements;
            const elements = (_a = ((target === null || target === void 0 ? void 0 : target.form) || target)) === null || _a === void 0 ? void 0 : _a.querySelectorAll('[name]');
            for (const element of elements) {
                const { type, name, checked, hidden } = element;
                if (!name)
                    continue;
                if (hidden)
                    continue;
                if (type === 'radio' && !checked)
                    continue;
                if (type === 'submit' || type === 'button')
                    continue;
                let value;
                if (type === 'select-multiple') {
                    value = [];
                    for (const option of element.selectedOptions) {
                        value.push(Value(option));
                    }
                }
                else if (type === 'select-one') {
                    const [option] = element.selectedOptions;
                    value = Value(option);
                }
                else {
                    value = Value(element);
                }
                let data = form;
                name.split(/\s*\.\s*/).forEach((part, index, parts) => {
                    const next = parts[index + 1];
                    if (next) {
                        if (!data[part]) {
                            data[part] = /[0-9]+/.test(next) ? [] : {};
                        }
                        data = data[part];
                    }
                    else {
                        data[part] = value;
                    }
                });
            }
            yield binder.compute({ $form: form, $event: event });
            if (target.getAttribute('reset'))
                target.reset();
            return false;
        });
    };
    const reset = function (event, binder) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const target = event.target;
            // const elements = target?.elements || target?.form?.elements;
            const elements = (_a = ((target === null || target === void 0 ? void 0 : target.form) || target)) === null || _a === void 0 ? void 0 : _a.querySelectorAll('[name]');
            for (const element of elements) {
                const { type, name, checked, hidden, nodeName } = element;
                if (!name)
                    continue;
                if (hidden)
                    continue;
                if (type === 'radio' && !checked)
                    continue;
                if (type === 'submit' || type === 'button')
                    continue;
                if (type === 'select-one') {
                    element.selectedIndex = 0;
                }
                else if (type === 'select-multiple') {
                    element.selectedIndex = -1;
                }
                else if (type === 'radio' || type === 'checkbox') {
                    element.checked = false;
                }
                else {
                    element.value = undefined;
                }
                element.dispatchEvent(new Event('input'));
            }
            yield binder.compute({ $event: event });
            return false;
        });
    };
    const onRender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            binder.owner[binder.name] = null;
            const name = binder.name.slice(2);
            if (!binder.meta.setup) {
                binder.meta.setup = true;
                binder.node.value = '';
            }
            if (binder.meta.method) {
                binder.owner.removeEventListener(name, binder.meta.method);
            }
            binder.meta.method = event => {
                if (name === 'reset') {
                    return reset(event, binder);
                }
                else if (name === 'submit') {
                    return submit(event, binder);
                }
                else {
                    return binder.compute({ $event: event });
                }
            };
            binder.owner.addEventListener(name, binder.meta.method);
        });
    };
    const onUnrender = function (binder) {
        return __awaiter(this, void 0, void 0, function* () {
            binder.owner[binder.name] = null;
            const name = binder.name.slice(2);
            if (binder.meta.method) {
                binder.owner.removeEventListener(name, binder.meta.method);
            }
        });
    };
    var on = { render: onRender, unrender: onUnrender };

    const caches = new Map();
    const splitPattern = /\s*{{\s*|\s*}}\s*/;
    const instancePattern = /(\$\w+)/;
    const bracketPattern = /({{)|(}})/;
    const eachPattern = /({{.*?\s+(of|in)\s+(.*?)}})/;
    const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
    const codePattern = new RegExp(`${eachPattern.source}|${assignmentPattern.source}|${instancePattern.source}|${bracketPattern.source}`, 'g');
    const ignores = [
        // '$assignee', '$instance', '$binder', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
        // '$e', '$v', '$c', '$f',
        '$instance', '$event', '$value', '$checked', '$form',
        'this', 'window', 'document', 'console', 'location',
        'globalThis', 'Infinity', 'NaN', 'undefined',
        'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent ',
        'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError', 'AggregateError',
        'Object', 'Function', 'Boolean', 'Symbole', 'Array',
        'Number', 'Math', 'Date', 'BigInt',
        'String', 'RegExp',
        'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
        'Int32Array', 'Uint32Array', 'BigInt64Array', 'BigUint64Array', 'Float32Array', 'Float64Array',
        'Map', 'Set', 'WeakMap', 'WeakSet',
        'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics', 'JSON',
        'Promise', 'GeneratorFunction', 'AsyncGeneratorFunction', 'Generator', 'AsyncGenerator', 'AsyncFunction',
        'Reflect', 'Proxy',
    ];
    const has = function (target, key) {
        return ignores.includes(key) ? false : key in target;
    };
    const computer = function (binder) {
        let cache = caches.get(binder.value);
        if (!cache) {
            let code = binder.value;
            const convert = code.split(splitPattern).filter(part => part).length > 1;
            const isChecked = binder.node.name === 'checked';
            const isValue = binder.node.name === 'value';
            let reference = '';
            let assignment = '';
            let usesInstance = false;
            // let hasEvent, hasForm, hasValue, hasChecked;
            code = code.replace(codePattern, function (match, g1, g2, ofInRight, assignee, assigneeLeft, ref, assigneeMiddle, assigneeRight, instance, bracketLeft, bracketRight) {
                if (bracketLeft)
                    return convert ? `' + (` : '(';
                if (bracketRight)
                    return convert ? `) + '` : ')';
                if (ofInRight)
                    return `(${ofInRight})`;
                if (instance) {
                    usesInstance = true;
                    return match;
                }
                if (assignee) {
                    if (isValue || isChecked) {
                        reference = ref;
                        usesInstance = true;
                        assignment = assigneeLeft + assigneeRight;
                        return (convert ? `' + (` : '(') + assigneeLeft + ref + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                    }
                    else {
                        return (convert ? `' + (` : '(') + assigneeLeft + ref + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                    }
                }
            });
            code = convert ? `'${code}'` : code;
            if (usesInstance) {
                code = `
            $instance = $instance || {};
            with ($instance) {
                with ($context) {
                    if ($instance.$assignment) {
                        return ${code};
                    } else {
                        ${isValue ? `$instance.$value = ${reference || `undefined`};` : ''}
                        ${isChecked ? `$instance.$checked = ${reference || `undefined`};` : ''}
                        return ${assignment || code};
                    }
                }
            }
            `;
            }
            else {
                code = `with ($context) { return ${code}; }`;
            }
            code = `
            try {
                ${code}
            } catch (error){
                console.error(error);
            }
        `;
            cache = new Function('$context', '$binder', '$instance', code);
            caches.set(binder.value, cache);
        }
        return cache.bind(null, new Proxy(binder.context, { has }), binder);
        // return cache.bind(null, binder.context, binder);
    };

    const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
    const referenceMatch = new RegExp([
        '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)',
        '([^{}]*{{.*?\\s+(?:of|in)\\s+)',
        '((?:^|}}).*?{{)',
        '(}}.*?(?:{{|$))',
        `(
        (?:\\$assignee|\\$instance|\\$binder|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
            this|window|document|console|location|
            globalThis|Infinity|NaN|undefined|
            isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
            Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
            Object|Function|Boolean|Symbole|Array|
            Number|Math|Date|BigInt|
            String|RegExp|
            Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
            Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
            Map|Set|WeakMap|WeakSet|
            ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
            Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
            Reflect|Proxy|
            true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
            yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
        [a-zA-Z0-9$_.?\\[\\]]*
    )`,
        '([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)' // reference
    ].join('|').replace(/\s|\t|\n/g, ''), 'g');
    const cache = new Map();
    const parser = function (data, rewrites) {
        data = data.replace(normalizeReference, '.$2');
        if (rewrites) {
            for (const [name, value] of rewrites) {
                data = data.replace(name, `$1${value}`);
            }
        }
        const cached = cache.get(data);
        if (cached)
            return cached;
        const references = [];
        cache.set(data, references);
        let match;
        while (match = referenceMatch.exec(data)) {
            let reference = match[6];
            if (reference) {
                references.push(reference);
            }
        }
        // console.log(data, references);
        return references;
    };

    const TN = Node.TEXT_NODE;
    const EN = Node.ELEMENT_NODE;
    // const AN = Node.ATTRIBUTE_NODE;
    class Binder {
        constructor() {
            this.prefix = 'o-';
            this.prefixEach = 'o-each';
            this.prefixValue = 'o-value';
            this.syntaxEnd = '}}';
            this.syntaxStart = '{{';
            this.syntaxLength = 2;
            this.syntaxMatch = new RegExp('{{.*?}}');
            this.prefixReplace = new RegExp('^o-');
            this.syntaxReplace = new RegExp('{{|}}', 'g');
            this.nodeBinders = new Map();
            this.ownerBinders = new Map();
            this.pathBinders = new Map();
            this.binders = {
                standard,
                checked,
                inherit,
                value,
                each,
                html,
                text,
                on,
            };
        }
        get(data) {
            if (typeof data === 'string') {
                return this.pathBinders.get(data);
            }
            else {
                return this.nodeBinders.get(data);
            }
        }
        unbind(node) {
            return __awaiter(this, void 0, void 0, function* () {
                const ownerBinders = this.ownerBinders.get(node);
                if (!ownerBinders)
                    return;
                for (const ownerBinder of ownerBinders) {
                    this.nodeBinders.delete(ownerBinder.node);
                    for (const path of ownerBinder.paths) {
                        const pathBinders = this.pathBinders.get(path);
                        if (!pathBinders)
                            continue;
                        pathBinders.delete(ownerBinder);
                        if (!pathBinders.size)
                            this.pathBinders.delete(path);
                    }
                }
                this.nodeBinders.delete(node);
                this.ownerBinders.delete(node);
            });
        }
        bind(node, container, name, value, owner, context, rewrites) {
            return __awaiter(this, void 0, void 0, function* () {
                const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
                const handler = this.binders[type];
                const binder = {
                    meta: {},
                    ready: true,
                    binder: this,
                    paths: undefined,
                    render: undefined,
                    compute: undefined,
                    unrender: undefined,
                    binders: this.pathBinders,
                    node, owner, name, value, rewrites, context, container, type,
                };
                const [paths, compute] = yield Promise.all([
                    parser(value, rewrites),
                    computer(binder)
                ]);
                binder.paths = paths;
                binder.compute = compute;
                binder.render = handler.render.bind(null, binder);
                binder.unrender = handler.unrender.bind(null, binder);
                for (const reference of paths) {
                    const binders = binder.binders.get(reference);
                    if (binders) {
                        binders.add(binder);
                    }
                    else {
                        binder.binders.set(reference, new Set([binder]));
                    }
                }
                this.nodeBinders.set(node, binder);
                const ownerBinders = this.ownerBinders.get(binder.owner);
                if (ownerBinders) {
                    ownerBinders.add(binder);
                }
                else {
                    this.ownerBinders.set(binder.owner, new Set([binder]));
                }
                return binder.render();
            });
        }
        ;
        remove(node) {
            return __awaiter(this, void 0, void 0, function* () {
                const tasks = [];
                // if (node.nodeType === AN) {
                //     tasks.push(this.unbind(node));
                if (node.nodeType === TN) {
                    this.unbind(node);
                }
                else if (node.nodeType === EN) {
                    this.unbind(node);
                    const attributes = node.attributes;
                    for (const attribute of attributes) {
                        tasks.push(this.unbind(attribute));
                    }
                    let child = node.firstChild;
                    while (child) {
                        // this.remove(child);
                        tasks.push(this.remove(child));
                        child = child.nextSibling;
                    }
                }
                return Promise.all(tasks);
            });
        }
        add(node, container, context, rewrites) {
            return __awaiter(this, void 0, void 0, function* () {
                // if (node.nodeType === AN) {
                //     const attribute = (node as Attr);
                //     if (this.syntaxMatch.test(attribute.value)) {
                //         tasks.push(this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                //     }
                // } else
                if (node.nodeType === TN) {
                    const tasks = [];
                    const start = node.nodeValue.indexOf(this.syntaxStart);
                    if (start === -1)
                        return;
                    if (start !== 0)
                        node = node.splitText(start);
                    const end = node.nodeValue.indexOf(this.syntaxEnd);
                    if (end === -1)
                        return;
                    if (end + this.syntaxLength !== node.nodeValue.length) {
                        const split = node.splitText(end + this.syntaxLength);
                        tasks.push(this.add(split, container, context, rewrites));
                    }
                    tasks.push(this.bind(node, container, 'text', node.nodeValue, node, context, rewrites));
                    return Promise.all(tasks);
                }
                else if (node.nodeType === EN) {
                    const attributes = node.attributes;
                    const inherit = attributes['inherit'];
                    if (inherit) {
                        // await window.customElements.whenDefined((node as any).localName);
                        // await (node as any).whenReady();
                        if (!node.ready) {
                            yield new Promise((resolve) => node.addEventListener('ready', resolve));
                        }
                        yield this.bind(inherit, container, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);
                    }
                    const each = attributes['each'];
                    if (each)
                        yield this.bind(each, container, each.name, each.value, each.ownerElement, context, rewrites);
                    if (!each && !inherit) {
                        let child = node.firstChild;
                        if (child) {
                            const tasks = [];
                            do {
                                tasks.push(this.add(child, container, context, rewrites));
                            } while (child = child.nextSibling);
                            if (tasks.length)
                                yield Promise.all(tasks);
                        }
                    }
                    if (attributes.length) {
                        const tasks = [];
                        for (const attribute of attributes) {
                            if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.syntaxMatch.test(attribute.value)) {
                                tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                            }
                        }
                        if (tasks.length)
                            yield Promise.all(tasks);
                    }
                }
            });
        }
    }

    var _Css_data, _Css_style, _Css_support, _a$1;
    var Css = new (_a$1 = class Css {
            constructor() {
                _Css_data.set(this, new Map());
                _Css_style.set(this, document.createElement('style'));
                _Css_support.set(this, !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)'));
                __classPrivateFieldGet(this, _Css_style, "f").appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
                __classPrivateFieldGet(this, _Css_style, "f").setAttribute('title', 'oxe');
                document.head.appendChild(__classPrivateFieldGet(this, _Css_style, "f"));
            }
            scope(name, text) {
                return text
                    .replace(/\t|\n\s*/g, '')
                    // .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
                    .replace(/:host/g, name);
            }
            transform(text = '') {
                if (!__classPrivateFieldGet(this, _Css_support, "f")) {
                    const matches = text.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];
                    for (let i = 0; i < matches.length; i++) {
                        const match = matches[i];
                        const rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
                        const pattern = new RegExp('var\\(' + rule[1] + '\\)', 'g');
                        text = text.replace(rule[0], '');
                        text = text.replace(pattern, rule[2]);
                    }
                }
                return text;
            }
            detach(name) {
                const item = __classPrivateFieldGet(this, _Css_data, "f").get(name);
                if (!item)
                    return;
                item.count--;
                if (item.count === 1) {
                    __classPrivateFieldGet(this, _Css_data, "f").delete(name);
                    __classPrivateFieldGet(this, _Css_style, "f").removeChild(item.node);
                }
            }
            attach(name, text) {
                let item = __classPrivateFieldGet(this, _Css_data, "f").get(name);
                if (item) {
                    item.count++;
                }
                else {
                    item = { count: 1, node: this.node(name, text) };
                    __classPrivateFieldGet(this, _Css_data, "f").set(name, item);
                    __classPrivateFieldGet(this, _Css_style, "f").appendChild(item.node);
                }
            }
            node(name, text) {
                return document.createTextNode(this.scope(name, this.transform(text)));
            }
        },
        _Css_data = new WeakMap(),
        _Css_style = new WeakMap(),
        _Css_support = new WeakMap(),
        _a$1);

    var _Component_instances, _Component_root, _Component_binder, _Component_flag, _Component_ready, _Component_name, _Component_adopted, _Component_rendered, _Component_connected, _Component_disconnected, _Component_attributed, _Component_readyEvent, _Component_afterRenderEvent, _Component_beforeRenderEvent, _Component_afterConnectedEvent, _Component_beforeConnectedEvent, _Component_observe, _Component_render;
    class Component extends HTMLElement {
        constructor() {
            super();
            _Component_instances.add(this);
            _Component_root.set(this, void 0);
            _Component_binder.set(this, void 0);
            // #template: any;
            _Component_flag.set(this, false);
            _Component_ready.set(this, false);
            _Component_name.set(this, this.nodeName.toLowerCase());
            // this overwrites extends methods
            // adopted: () => void;
            // rendered: () => void;
            // connected: () => void;
            // disconnected: () => void;
            // attributed: (name: string, from: string, to: string) => void;
            _Component_adopted.set(this, void 0);
            _Component_rendered.set(this, void 0);
            _Component_connected.set(this, void 0);
            _Component_disconnected.set(this, void 0);
            _Component_attributed.set(this, void 0);
            _Component_readyEvent.set(this, new Event('ready'));
            _Component_afterRenderEvent.set(this, new Event('afterrender'));
            _Component_beforeRenderEvent.set(this, new Event('beforerender'));
            _Component_afterConnectedEvent.set(this, new Event('afterconnected'));
            _Component_beforeConnectedEvent.set(this, new Event('beforeconnected'));
            // #css: string = typeof (this as any).css === 'string' ? (this as any).css : '';
            // #html: string = typeof (this as any).html === 'string' ? (this as any).html : '';
            // #data: object = typeof (this as any).data === 'object' ? (this as any).data : {};
            // #adopt: boolean = typeof (this as any).adopt === 'boolean' ? (this as any).adopt : false;
            // #shadow: boolean = typeof (this as any).shadow === 'boolean' ? (this as any).shadow : false;
            this.css = '';
            this.html = '';
            this.data = {};
            this.adopt = false;
            this.shadow = false;
            __classPrivateFieldSet(this, _Component_binder, new Binder(), "f");
            __classPrivateFieldSet(this, _Component_adopted, this.adopted, "f");
            __classPrivateFieldSet(this, _Component_rendered, this.rendered, "f");
            __classPrivateFieldSet(this, _Component_connected, this.connected, "f");
            __classPrivateFieldSet(this, _Component_attributed, this.attributed, "f");
            __classPrivateFieldSet(this, _Component_disconnected, this.disconnected, "f");
            if (this.shadow && 'attachShadow' in document.body) {
                __classPrivateFieldSet(this, _Component_root, this.attachShadow({ mode: 'open' }), "f");
            }
            else if (this.shadow && 'createShadowRoot' in document.body) {
                __classPrivateFieldSet(this, _Component_root, this.createShadowRoot(), "f");
            }
            else {
                __classPrivateFieldSet(this, _Component_root, this, "f");
            }
            // this.#template = document.createElement('template');
            // this.#template.innerHTML = this.html;
        }
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        get root() { return __classPrivateFieldGet(this, _Component_root, "f"); }
        get ready() { return __classPrivateFieldGet(this, _Component_ready, "f"); }
        get binder() { return __classPrivateFieldGet(this, _Component_binder, "f"); }
        ;
        // async whenReady () {
        //     if (!this.#ready) {
        //         return new Promise(resolve => this.addEventListener('afterrender', resolve));
        //     }
        // }
        attributeChangedCallback(name, from, to) {
            return __awaiter(this, void 0, void 0, function* () {
                yield __classPrivateFieldGet(this, _Component_attributed, "f").call(this, name, from, to);
            });
        }
        adoptedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                if (__classPrivateFieldGet(this, _Component_adopted, "f"))
                    yield __classPrivateFieldGet(this, _Component_adopted, "f").call(this);
            });
        }
        disconnectedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                Css.detach(__classPrivateFieldGet(this, _Component_name, "f"));
                if (__classPrivateFieldGet(this, _Component_disconnected, "f"))
                    yield __classPrivateFieldGet(this, _Component_disconnected, "f").call(this);
            });
        }
        connectedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                Css.attach(__classPrivateFieldGet(this, _Component_name, "f"), this.css);
                if (!__classPrivateFieldGet(this, _Component_flag, "f")) {
                    __classPrivateFieldSet(this, _Component_flag, true, "f");
                    this.dispatchEvent(__classPrivateFieldGet(this, _Component_beforeRenderEvent, "f"));
                    yield __classPrivateFieldGet(this, _Component_instances, "m", _Component_render).call(this);
                    if (__classPrivateFieldGet(this, _Component_rendered, "f"))
                        yield __classPrivateFieldGet(this, _Component_rendered, "f").call(this);
                    this.dispatchEvent(__classPrivateFieldGet(this, _Component_afterRenderEvent, "f"));
                    __classPrivateFieldSet(this, _Component_ready, true, "f");
                    this.dispatchEvent(__classPrivateFieldGet(this, _Component_readyEvent, "f"));
                }
                this.dispatchEvent(__classPrivateFieldGet(this, _Component_beforeConnectedEvent, "f"));
                if (__classPrivateFieldGet(this, _Component_connected, "f"))
                    yield __classPrivateFieldGet(this, _Component_connected, "f").call(this);
                this.dispatchEvent(__classPrivateFieldGet(this, _Component_afterConnectedEvent, "f"));
            });
        }
    }
    _Component_root = new WeakMap(), _Component_binder = new WeakMap(), _Component_flag = new WeakMap(), _Component_ready = new WeakMap(), _Component_name = new WeakMap(), _Component_adopted = new WeakMap(), _Component_rendered = new WeakMap(), _Component_connected = new WeakMap(), _Component_disconnected = new WeakMap(), _Component_attributed = new WeakMap(), _Component_readyEvent = new WeakMap(), _Component_afterRenderEvent = new WeakMap(), _Component_beforeRenderEvent = new WeakMap(), _Component_afterConnectedEvent = new WeakMap(), _Component_beforeConnectedEvent = new WeakMap(), _Component_instances = new WeakSet(), _Component_observe = function _Component_observe(path, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const parents = __classPrivateFieldGet(this, _Component_binder, "f").pathBinders.get(path);
            if (parents) {
                // console.log('path:',path);
                const parentTasks = [];
                for (const binder of parents) {
                    if (!binder)
                        continue;
                    parentTasks.push(binder[type]());
                }
                yield Promise.all(parentTasks);
            }
            for (const [key, children] of __classPrivateFieldGet(this, _Component_binder, "f").pathBinders) {
                if (!children)
                    continue;
                if (key.startsWith(`${path}.`)) {
                    // console.log('key:', key);
                    for (const binder of children) {
                        if (!binder)
                            continue;
                        binder[type]();
                    }
                }
            }
        });
    }, _Component_render = function _Component_render() {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = [];
            this.data = observer(typeof this.data === 'function' ? yield this.data() : this.data, __classPrivateFieldGet(this, _Component_instances, "m", _Component_observe).bind(this));
            if (this.adopt) {
                let child = this.firstChild;
                while (child) {
                    tasks.push(__classPrivateFieldGet(this, _Component_binder, "f").add(child, this, this.data));
                    // this.#binder.add(child, this, this.data);
                    child = child.nextSibling;
                }
            }
            const template = document.createElement('template');
            template.innerHTML = this.html;
            if (!this.shadow ||
                !('attachShadow' in document.body) &&
                    !('createShadowRoot' in document.body)) {
                const templateSlots = template.content.querySelectorAll('slot[name]');
                const defaultSlot = template.content.querySelector('slot:not([name])');
                for (let i = 0; i < templateSlots.length; i++) {
                    const templateSlot = templateSlots[i];
                    const name = templateSlot.getAttribute('name');
                    const instanceSlot = this.querySelector('[slot="' + name + '"]');
                    if (instanceSlot)
                        templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
                    else
                        templateSlot.parentNode.removeChild(templateSlot);
                }
                if (this.children.length) {
                    while (this.firstChild) {
                        if (defaultSlot)
                            defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
                        else
                            this.removeChild(this.firstChild);
                    }
                }
                if (defaultSlot)
                    defaultSlot.parentNode.removeChild(defaultSlot);
            }
            let child = template.content.firstChild;
            while (child) {
                tasks.push(__classPrivateFieldGet(this, _Component_binder, "f").add(child, this, this.data));
                // this.#binder.add(child, this, this.data);
                child = child.nextSibling;
            }
            __classPrivateFieldGet(this, _Component_root, "f").appendChild(template.content);
            yield Promise.all(tasks);
        });
    };

    var Fetcher = new class Fetcher {
        constructor() {
            this.option = {};
            this.types = [
                'json',
                'text',
                'blob',
                'formData',
                'arrayBuffer'
            ];
            this.mime = {
                xml: 'text/xml; charset=utf-8',
                html: 'text/html; charset=utf-8',
                text: 'text/plain; charset=utf-8',
                json: 'application/json; charset=utf-8',
                js: 'application/javascript; charset=utf-8'
            };
        }
        setup(option = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                this.option.path = option.path;
                this.option.method = option.method;
                this.option.origin = option.origin;
                this.option.before = option.before;
                this.option.headers = option.headers;
                this.option.after = option.after;
                this.option.acceptType = option.acceptType;
                this.option.credentials = option.credentials;
                this.option.contentType = option.contentType;
                this.option.responseType = option.responseType;
            });
        }
        method(method, data) {
            return __awaiter(this, void 0, void 0, function* () {
                data = typeof data === 'string' ? { url: data } : data;
                return this.fetch(Object.assign(Object.assign({}, data), { method }));
            });
        }
        get() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('get', ...arguments);
            });
        }
        put() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('put', ...arguments);
            });
        }
        post() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('post', ...arguments);
            });
        }
        head() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('head', ...arguments);
            });
        }
        patch() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('patch', ...arguments);
            });
        }
        delete() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('delete', ...arguments);
            });
        }
        options() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('options', ...arguments);
            });
        }
        connect() {
            return __awaiter(this, arguments, void 0, function* () {
                return this.method('connect', ...arguments);
            });
        }
        serialize(data) {
            return __awaiter(this, void 0, void 0, function* () {
                let query = '';
                for (const name in data) {
                    query = query.length > 0 ? query + '&' : query;
                    query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
                }
                return query;
            });
        }
        fetch(data = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                const { option } = this;
                const context = Object.assign(Object.assign({}, option), data);
                if (context.path && typeof context.path === 'string' && context.path.charAt(0) === '/')
                    context.path = context.path.slice(1);
                if (context.origin && typeof context.origin === 'string' && context.origin.charAt(context.origin.length - 1) === '/')
                    context.origin = context.origin.slice(0, -1);
                if (context.path && context.origin && !context.url)
                    context.url = context.origin + '/' + context.path;
                if (!context.method)
                    throw new Error('Oxe.fetcher.fetch - requires method option');
                if (!context.url)
                    throw new Error('Oxe.fetcher.fetch - requires url or origin and path option');
                context.aborted = false;
                context.headers = context.headers || {};
                context.method = context.method.toUpperCase();
                Object.defineProperty(context, 'abort', {
                    enumerable: true,
                    value() { context.aborted = true; return context; }
                });
                if (context.contentType) {
                    switch (context.contentType) {
                        case 'js':
                            context.headers['Content-Type'] = this.mime.js;
                            break;
                        case 'xml':
                            context.headers['Content-Type'] = this.mime.xml;
                            break;
                        case 'html':
                            context.headers['Content-Type'] = this.mime.html;
                            break;
                        case 'json':
                            context.headers['Content-Type'] = this.mime.json;
                            break;
                        default: context.headers['Content-Type'] = context.contentType;
                    }
                }
                if (context.acceptType) {
                    switch (context.acceptType) {
                        case 'js':
                            context.headers['Accept'] = this.mime.js;
                            break;
                        case 'xml':
                            context.headers['Accept'] = this.mime.xml;
                            break;
                        case 'html':
                            context.headers['Accept'] = this.mime.html;
                            break;
                        case 'json':
                            context.headers['Accept'] = this.mime.json;
                            break;
                        default: context.headers['Accept'] = context.acceptType;
                    }
                }
                if (typeof option.before === 'function')
                    yield option.before(context);
                if (context.aborted)
                    return;
                if (context.body) {
                    if (context.method === 'GET') {
                        context.url = context.url + '?' + (yield this.serialize(context.body));
                        // } else if (context.contentType === 'json') {
                    }
                    else if (typeof context.body === 'object') {
                        context.body = JSON.stringify(context.body);
                    }
                }
                const result = yield window.fetch(context.url, context);
                Object.defineProperties(context, {
                    result: { enumerable: true, value: result },
                    code: { enumerable: true, value: result.status }
                    // headers: { enumerable: true, value: result.headers }
                    // message: { enumerable: true, value: result.statusText }
                });
                const responseType = context.responseType === 'buffer' ? 'arrayBuffer' : context.responseType || '';
                const contentType = result.headers.get('content-type') || result.headers.get('Content-Type') || '';
                let type;
                if (responseType)
                    type = responseType;
                else if (contentType.includes('application/json'))
                    type = 'json';
                else if (contentType.includes('text/plain'))
                    type = 'text';
                if (!this.types.includes(type))
                    throw new Error('Oxe.fetcher.fetch - invalid responseType');
                context.body = yield result[type]();
                if (typeof option.after === 'function')
                    yield option.after(context);
                if (context.aborted)
                    return;
                return context;
            });
        }
    };

    // declare global {
    // https://regexr.com/5nj32
    const S_EXPORT = `

    ^export\\b
    (?:
        \\s*(default)\\s*
    )?
    (?:
        \\s*(var|let|const|function|class)\\s*
    )?
    (\\s*?:{\\s*)?
    (
        (?:\\w+\\s*,?\\s*)*
    )?
    (\\s*?:}\\s*)?

`.replace(/\s+/g, '');
    // https://regexr.com/5nj38
    const S_IMPORT = `

    import
    (?:
        (?:
            \\s+(\\w+)(?:\\s+|\\s*,\\s*)
        )
        ?
        (?:
            (?:\\s+(\\*\\s+as\\s+\\w+)\\s+)
            |
            (?:
                \\s*{\\s*
                (
                    (?:
                        (?:
                            (?:\\w+)
                            |
                            (?:\\w+\\s+as\\s+\\w+)
                        )
                        \\s*,?\\s*
                    )
                    *
                )
                \\s*}\\s*
            )
        )
        ?
        from
    )
    ?
    \\s*
    (?:"|')
    (.*?)
    (?:'|")
    (?:\\s*;)?

`.replace(/\s+/g, '');
    const R_IMPORT = new RegExp(S_IMPORT);
    const R_EXPORT = new RegExp(S_EXPORT);
    const R_IMPORTS = new RegExp(S_IMPORT, 'g');
    const R_EXPORTS = new RegExp(S_EXPORT, 'gm');
    const R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;
    const isAbsolute = function (path) {
        if (path.startsWith('/') ||
            path.startsWith('//') ||
            path.startsWith('://') ||
            path.startsWith('ftp://') ||
            path.startsWith('file://') ||
            path.startsWith('http://') ||
            path.startsWith('https://')) {
            return true;
        }
        else {
            return false;
        }
    };
    const resolve = function (...paths) {
        let path = (paths[0] || '').trim();
        for (let i = 1; i < paths.length; i++) {
            const part = paths[i].trim();
            if (path[path.length - 1] !== '/' && part[0] !== '/') {
                path += '/';
            }
            path += part;
        }
        const a = window.document.createElement('a');
        a.href = path;
        return a.href;
    };
    const fetch = function (url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        resolve(xhr.responseText);
                    }
                    else {
                        reject(new Error(`failed to import: ${url}`));
                    }
                }
            };
            try {
                xhr.open('GET', url, true);
                xhr.send();
            }
            catch (_a) {
                reject(new Error(`failed to import: ${url}`));
            }
        });
    };
    const run = function (code) {
        return new Promise(function (resolve, reject) {
            const blob = new Blob([code], { type: 'text/javascript' });
            const script = document.createElement('script');
            if ('noModule' in script) {
                script.type = 'module';
            }
            script.onerror = function (error) {
                reject(error);
                script.remove();
                URL.revokeObjectURL(script.src);
            };
            script.onload = function (error) {
                resolve(error);
                script.remove();
                URL.revokeObjectURL(script.src);
            };
            script.src = URL.createObjectURL(blob);
            document.head.appendChild(script);
        });
    };
    const transform = function (code, url) {
        let before = `window.MODULES["${url}"] = Promise.all([\n`;
        let after = ']).then(function ($MODULES) {\n';
        const templateMatches = code.match(R_TEMPLATES) || [];
        for (let i = 0; i < templateMatches.length; i++) {
            const templateMatch = templateMatches[i];
            code = code.replace(templateMatch, templateMatch
                .replace(/'/g, '\\' + '\'')
                .replace(/^([^\\])?`/, '$1\'')
                .replace(/([^\\])?`$/, '$1\'')
                .replace(/\${(.*)?}/g, '\'+$1+\'')
                .replace(/\n/g, '\\n'));
        }
        const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
        const importMatches = code.match(R_IMPORTS) || [];
        for (let i = 0, l = importMatches.length; i < l; i++) {
            const importMatch = importMatches[i].match(R_IMPORT);
            if (!importMatch)
                continue;
            const rawImport = importMatch[0];
            const nameImport = importMatch[1]; // default
            let pathImport = importMatch[4] || importMatch[5];
            if (isAbsolute(pathImport)) {
                pathImport = resolve(pathImport);
            }
            else {
                pathImport = resolve(parentImport, pathImport);
            }
            before = `${before} \twindow.LOAD("${pathImport}"),\n`;
            after = `${after}var ${nameImport} = $MODULES[${i}].default;\n`;
            code = code.replace(rawImport, '') || [];
        }
        let hasDefault = false;
        const exportMatches = code.match(R_EXPORTS) || [];
        for (let i = 0, l = exportMatches.length; i < l; i++) {
            const exportMatch = exportMatches[i].match(R_EXPORT) || [];
            const rawExport = exportMatch[0];
            const defaultExport = exportMatch[1] || '';
            const typeExport = exportMatch[2] || '';
            const nameExport = exportMatch[3] || '';
            if (defaultExport) {
                if (hasDefault) {
                    code = code.replace(rawExport, `$DEFAULT = ${typeExport} ${nameExport}`);
                }
                else {
                    hasDefault = true;
                    code = code.replace(rawExport, `var $DEFAULT = ${typeExport} ${nameExport}`);
                }
            }
        }
        if (hasDefault) {
            code += '\n\nreturn { default: $DEFAULT };\n';
        }
        code = '"use strict";\n' + before + after + code + '});';
        return code;
    };
    const load = function (url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url)
                throw new Error('Oxe.load - url required');
            url = resolve(url);
            // window.REGULAR_SUPPORT = false;
            // window.DYNAMIC_SUPPORT = false;
            if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
                yield run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
                window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
            }
            if (window.DYNAMIC_SUPPORT === true) {
                // console.log('native import');
                yield run(`window.MODULES["${url}"] = import("${url}");`);
                return window.MODULES[url];
            }
            // console.log('not native import');
            if (window.MODULES[url]) {
                // maybe clean up
                return window.MODULES[url];
            }
            if (typeof window.REGULAR_SUPPORT !== 'boolean') {
                const script = document.createElement('script');
                window.REGULAR_SUPPORT = 'noModule' in script;
            }
            let code;
            if (window.REGULAR_SUPPORT) {
                // console.log('noModule: yes');
                code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
            }
            else {
                // console.log('noModule: no');
                code = yield fetch(url);
                code = transform(code, url);
            }
            try {
                yield run(code);
            }
            catch (_a) {
                throw new Error(`Oxe.load - failed to import: ${url}`);
            }
            return this.modules[url];
        });
    };
    window.LOAD = window.LOAD || load;
    window.MODULES = window.MODULES || {};

    var _Router_instances, _Router_target, _Router_data, _Router_folder, _Router_cache, _Router_dynamic, _Router_contain, _Router_external, _Router_after, _Router_before, _Router_location, _Router_go, _Router_state, _Router_click, _a;
    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Router = new (_a = class Router {
            constructor() {
                _Router_instances.add(this);
                _Router_target.set(this, void 0);
                _Router_data.set(this, {});
                _Router_folder.set(this, '');
                _Router_cache.set(this, true);
                _Router_dynamic.set(this, true);
                _Router_contain.set(this, false);
                _Router_external.set(this, void 0);
                _Router_after.set(this, void 0);
                _Router_before.set(this, void 0);
            }
            get hash() { return window.location.hash; }
            get host() { return window.location.host; }
            get hostname() { return window.location.hostname; }
            get href() { return window.location.href; }
            get origin() { return window.location.origin; }
            get pathname() { return window.location.pathname; }
            get port() { return window.location.port; }
            get protocol() { return window.location.protocol; }
            get search() { return window.location.search; }
            get query() {
                const result = {};
                const search = window.location.search;
                if (!search)
                    return result;
                const queries = search.slice(1).split('&');
                for (const query of queries) {
                    let [name, value] = query.split('=');
                    name = decodeURIComponent(name.replace(/\+/g, ' '));
                    value = decodeURIComponent(value.replace(/\+/g, ' '));
                    if (name in result) {
                        if (typeof result[name] === 'object') {
                            result[name].push(value);
                        }
                        else {
                            result[name] = [result[name], value];
                        }
                    }
                    else {
                        result[name] = value;
                    }
                }
                return result;
            }
            // set query (search) { }
            back() { window.history.back(); }
            forward() { window.history.forward(); }
            reload() { window.location.reload(); }
            redirect(href) { window.location.href = href; }
            setup(option) {
                return __awaiter(this, void 0, void 0, function* () {
                    if ('folder' in option)
                        __classPrivateFieldSet(this, _Router_folder, option.folder, "f");
                    if ('contain' in option)
                        __classPrivateFieldSet(this, _Router_contain, option.contain, "f");
                    if ('dynamic' in option)
                        __classPrivateFieldSet(this, _Router_dynamic, option.dynamic, "f");
                    if ('external' in option)
                        __classPrivateFieldSet(this, _Router_external, option.external, "f");
                    if ('before' in option)
                        __classPrivateFieldSet(this, _Router_before, option.before, "f");
                    if ('after' in option)
                        __classPrivateFieldSet(this, _Router_after, option.after, "f");
                    if ('cache' in option)
                        __classPrivateFieldSet(this, _Router_cache, option.cache, "f");
                    // if ('beforeConnected' in option) this.#beforeConnected = option.beforeConnected;
                    // if ('afterConnected' in option) this.#afterConnected = option.afterConnected;
                    __classPrivateFieldSet(this, _Router_target, option.target instanceof Element ? option.target : document.body.querySelector(option.target), "f");
                    if (__classPrivateFieldGet(this, _Router_dynamic, "f")) {
                        window.addEventListener('popstate', __classPrivateFieldGet(this, _Router_instances, "m", _Router_state).bind(this), true);
                        if (__classPrivateFieldGet(this, _Router_contain, "f")) {
                            __classPrivateFieldGet(this, _Router_target, "f").addEventListener('click', __classPrivateFieldGet(this, _Router_instances, "m", _Router_click).bind(this), true);
                        }
                        else {
                            window.document.addEventListener('click', __classPrivateFieldGet(this, _Router_instances, "m", _Router_click).bind(this), true);
                        }
                    }
                    return this.replace(window.location.href);
                });
            }
            assign(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return __classPrivateFieldGet(this, _Router_instances, "m", _Router_go).call(this, data, { mode: 'push' });
                });
            }
            replace(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return __classPrivateFieldGet(this, _Router_instances, "m", _Router_go).call(this, data, { mode: 'replace' });
                });
            }
        },
        _Router_target = new WeakMap(),
        _Router_data = new WeakMap(),
        _Router_folder = new WeakMap(),
        _Router_cache = new WeakMap(),
        _Router_dynamic = new WeakMap(),
        _Router_contain = new WeakMap(),
        _Router_external = new WeakMap(),
        _Router_after = new WeakMap(),
        _Router_before = new WeakMap(),
        _Router_instances = new WeakSet(),
        _Router_location = function _Router_location(href = window.location.href) {
            const parser = document.createElement('a');
            parser.href = href;
            return {
                // path: '',
                // path: parser.pathname,
                href: parser.href,
                host: parser.host,
                port: parser.port,
                hash: parser.hash,
                search: parser.search,
                protocol: parser.protocol,
                hostname: parser.hostname,
                pathname: parser.pathname
                // pathname: parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname
            };
            // location.path = location.pathname + location.search + location.hash;
            // return location;
        },
        _Router_go = function _Router_go(path, options = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                // if (options.query) {
                //     path += Query(options.query);
                // }
                const mode = options.mode || 'push';
                const location = __classPrivateFieldGet(this, _Router_instances, "m", _Router_location).call(this, path);
                let element;
                if (location.pathname in __classPrivateFieldGet(this, _Router_data, "f")) {
                    const route = __classPrivateFieldGet(this, _Router_data, "f")[location.pathname];
                    element = __classPrivateFieldGet(this, _Router_cache, "f") ? route.element : window.document.createElement(route.name);
                }
                else {
                    const path = location.pathname.endsWith('/') ? `${location.pathname}index` : location.pathname;
                    const base = document.baseURI.replace(window.location.origin, '');
                    let load$1 = path.startsWith(base) ? path.replace(base, '') : path;
                    if (load$1.slice(0, 2) === './')
                        load$1 = load$1.slice(2);
                    if (load$1.slice(0, 1) !== '/')
                        load$1 = '/' + load$1;
                    if (load$1.slice(0, 1) === '/')
                        load$1 = load$1.slice(1);
                    load$1 = `${__classPrivateFieldGet(this, _Router_folder, "f")}/${load$1}.js`.replace(/\/+/g, '/');
                    load$1 = absolute(load$1);
                    let component;
                    try {
                        component = (yield load(load$1)).default;
                    }
                    catch (error) {
                        if (error.message === `Failed to fetch dynamically imported module: ${window.location.origin}${load$1}`) {
                            component = (yield load(absolute(`${__classPrivateFieldGet(this, _Router_folder, "f")}/all.js`))).default;
                        }
                        else {
                            throw error;
                        }
                    }
                    const name = 'route' + path.replace(/\/+/g, '-');
                    window.customElements.define(name, component);
                    element = window.document.createElement(name);
                    __classPrivateFieldGet(this, _Router_data, "f")[location.pathname] = { element: __classPrivateFieldGet(this, _Router_cache, "f") ? element : null, name };
                }
                if (__classPrivateFieldGet(this, _Router_before, "f"))
                    yield __classPrivateFieldGet(this, _Router_before, "f").call(this, location, element);
                if (!__classPrivateFieldGet(this, _Router_dynamic, "f")) {
                    return window.location[mode === 'push' ? 'assign' : mode](location.href);
                }
                window.history.replaceState({
                    href: window.location.href,
                    top: document.documentElement.scrollTop || document.body.scrollTop || 0
                }, '', window.location.href);
                window.history[mode + 'State']({
                    top: 0,
                    href: location.href
                }, '', location.href);
                const keywords = document.querySelector('meta[name="keywords"]');
                const description = document.querySelector('meta[name="description"]');
                if (element.title)
                    window.document.title = element.title;
                if (element.keywords && keywords)
                    keywords.setAttribute('content', element.keywords);
                if (element.description && description)
                    description.setAttribute('content', element.description);
                while (__classPrivateFieldGet(this, _Router_target, "f").firstChild) {
                    __classPrivateFieldGet(this, _Router_target, "f").removeChild(__classPrivateFieldGet(this, _Router_target, "f").firstChild);
                }
                if (__classPrivateFieldGet(this, _Router_after, "f")) {
                    element.removeEventListener('afterconnected', __classPrivateFieldGet(this, _Router_data, "f")[location.pathname].after);
                    const after = __classPrivateFieldGet(this, _Router_after, "f").bind(__classPrivateFieldGet(this, _Router_after, "f"), location, element);
                    __classPrivateFieldGet(this, _Router_data, "f")[location.pathname].after = after;
                    element.addEventListener('afterconnected', after);
                }
                __classPrivateFieldGet(this, _Router_target, "f").appendChild(element);
                window.dispatchEvent(new CustomEvent('router', { detail: location }));
            });
        },
        _Router_state = function _Router_state(event) {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                yield this.replace(((_a = event.state) === null || _a === void 0 ? void 0 : _a.href) || window.location.href);
                window.scroll(((_b = event.state) === null || _b === void 0 ? void 0 : _b.top) || 0, 0);
            });
        },
        _Router_click = function _Router_click(event) {
            return __awaiter(this, void 0, void 0, function* () {
                // ignore canceled events, modified clicks, and right clicks
                if (event.target.type ||
                    event.button !== 0 ||
                    event.defaultPrevented ||
                    event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
                    return;
                // if shadow dom use
                let target = event.path ? event.path[0] : event.target;
                let parent = target.parentElement;
                if (__classPrivateFieldGet(this, _Router_contain, "f")) {
                    while (parent) {
                        if (parent.nodeName === __classPrivateFieldGet(this, _Router_target, "f").nodeName) {
                            break;
                        }
                        else {
                            parent = parent.parentElement;
                        }
                    }
                    if (parent.nodeName !== __classPrivateFieldGet(this, _Router_target, "f").nodeName) {
                        return;
                    }
                }
                while (target && 'A' !== target.nodeName) {
                    target = target.parentElement;
                }
                if (!target || 'A' !== target.nodeName) {
                    return;
                }
                if (target.hasAttribute('download') ||
                    target.hasAttribute('external') ||
                    target.hasAttribute('o-external') ||
                    target.href.startsWith('tel:') ||
                    target.href.startsWith('ftp:') ||
                    target.href.startsWith('file:)') ||
                    target.href.startsWith('mailto:') ||
                    !target.href.startsWith(window.location.origin)
                // ||
                // (target.hash !== '' &&
                //     target.origin === window.location.origin &&
                //     target.pathname === window.location.pathname)
                )
                    return;
                // if external is true then default action
                if (__classPrivateFieldGet(this, _Router_external, "f") &&
                    (__classPrivateFieldGet(this, _Router_external, "f") instanceof RegExp && __classPrivateFieldGet(this, _Router_external, "f").test(target.href) ||
                        typeof __classPrivateFieldGet(this, _Router_external, "f") === 'function' && __classPrivateFieldGet(this, _Router_external, "f").call(this, target.href) ||
                        typeof __classPrivateFieldGet(this, _Router_external, "f") === 'string' && __classPrivateFieldGet(this, _Router_external, "f") === target.href))
                    return;
                event.preventDefault();
                this.assign(target.href);
            });
        },
        _a);
    // function Query (data) {
    //     data = data || window.location.search;
    //     if (typeof data === 'string') {
    //         const result = {};
    //         if (data.indexOf('?') === 0) data = data.slice(1);
    //         const queries = data.split('&');
    //         for (let i = 0; i < queries.length; i++) {
    //             const [ name, value ] = queries[i].split('=');
    //             if (name !== undefined && value !== undefined) {
    //                 if (name in result) {
    //                     if (typeof result[name] === 'string') {
    //                         result[name] = [ value ];
    //                     } else {
    //                         result[name].push(value);
    //                     }
    //                 } else {
    //                     result[name] = value;
    //                 }
    //             }
    //         }
    //         return result;
    //     } else {
    //         const result = [];
    //         for (const key in data) {
    //             const value = data[key];
    //             result.push(`${key}=${value}`);
    //         }
    //         return `?${result.join('&')}`;
    //     }
    // }

    const toDash = (data) => data.replace(/[a-zA-Z][A-Z]/g, c => `${c[0]}-${c[1]}`.toLowerCase());
    function Define(component) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof component === 'string') {
                const loaded = yield load(component);
                return Define(loaded.default);
            }
            else if (component instanceof Array) {
                return Promise.all(component.map(data => Define(data)));
            }
            else {
                const name = toDash(component.name);
                window.customElements.define(name, component);
            }
        });
    }

    if (typeof window.CustomEvent !== 'function') {
        window.CustomEvent = function CustomEvent(event, options) {
            options = options || { bubbles: false, cancelable: false, detail: null };
            var customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
            return customEvent;
        };
    }
    // if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
    //     window.Reflect = window.Reflect || {};
    //     window.Reflect.construct = function construct (parent, args, child) {
    //         'use strict';
    //         var target = child === undefined ? parent : child;
    //         var prototype = Object.create(target.prototype || Object.prototype);
    //         return Function.prototype.apply.call(parent, prototype, args) || prototype;
    //     };
    // }
    // if (window.NodeList && !window.NodeList.prototype.forEach) {
    //     window.NodeList.prototype.forEach = window.Array.prototype.forEach;
    // }
    if (!window.String.prototype.endsWith) {
        window.String.prototype.endsWith = function (search, this_len) {
            if (this_len === undefined || this_len > this.length)
                this_len = this.length;
            return this.substring(this_len - search.length, this_len) === search;
        };
    }
    if (!window.String.prototype.startsWith) {
        window.String.prototype.startsWith = function startsWith(search, rawPos) {
            var pos = rawPos > 0 ? rawPos | 0 : 0;
            return this.substring(pos, pos + search.length) === search;
        };
    }
    if (!window.String.prototype.includes) {
        window.String.prototype.includes = function includes(search, start) {
            if (search instanceof RegExp)
                throw TypeError('first argument must not be a RegExp');
            if (start === undefined) {
                start = 0;
            }
            return this.indexOf(search, start) !== -1;
        };
    }
    if (!window.Node.prototype.getRootNode) {
        window.Node.prototype.getRootNode = function getRootNode(opt) {
            var composed = typeof opt === 'object' && Boolean(opt.composed);
            return composed ? getShadowIncludingRoot(this) : getRoot(this);
        };
        function getShadowIncludingRoot(node) {
            var root = getRoot(node);
            if (isShadowRoot(root))
                return getShadowIncludingRoot(root.host);
            return root;
        }
        function getRoot(node) {
            if (node.parentNode != null)
                return getRoot(node.parentNode);
            return node;
        }
        function isShadowRoot(node) {
            return node.nodeName === '#document-fragment' && node.constructor.name === 'ShadowRoot';
        }
    }
    var index = Object.freeze(new class Oxe {
        constructor() {
            this.Component = Component;
            this.component = Component;
            this.Fetcher = Fetcher;
            this.fetcher = Fetcher;
            this.Router = Router;
            this.router = Router;
            this.Define = Define;
            this.define = Define;
            this.Load = load;
            this.load = load;
            this.Css = Css;
            this.css = Css;
        }
    });

    return index;

}));
