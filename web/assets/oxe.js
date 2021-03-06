
/*!
    Name: oxe
    Version: 5.2.9
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
}(this, (function () { 'use strict';

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

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    const isMap = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Map;
    const isDate = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Date;
    const isArray = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Array;
    const isString = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === String;
    const isNumber = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Number;
    const isObject = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Object;
    const isBoolean = (data) => (data === null || data === void 0 ? void 0 : data.constructor) === Boolean;
    const toArray = (data) => JSON.parse(data);
    const toObject = (data) => JSON.parse(data);
    const toBoolean = (data) => data === 'true';
    const toDate = (data) => new Date(Number(data));
    const toMap = (data) => new Map(JSON.parse(data));
    const toString = (data) => typeof data === 'string' ? data : JSON.stringify(data);
    const toNumber = (data) => data === '' || typeof data !== 'string' && typeof data !== 'number' ? NaN : Number(data);
    const to = function (source, target) {
        try {
            if (isMap(source))
                return toMap(target);
            if (isDate(source))
                return toDate(target);
            if (isArray(source))
                return toArray(target);
            if (isString(source))
                return toString(target);
            if (isObject(source))
                return toObject(target);
            if (isNumber(source))
                return toNumber(target);
            if (isBoolean(source))
                return toBoolean(target);
        }
        catch (_a) {
            return target;
        }
    };
    const toDash = (data) => data.replace(/[a-zA-Z][A-Z]/g, c => `${c[0]}-${c[1]}`.toLowerCase());
    const traverse = function (data, paths) {
        if (paths.length === 0) {
            return data;
        }
        else if (typeof data !== 'object') {
            return undefined;
        }
        else {
            return traverse(data[paths[0]], paths.slice(1));
        }
    };
    const match = function (source, target) {
        if (source === target) {
            return true;
        }
        const sourceType = typeof source;
        const targetType = typeof target;
        if (sourceType !== targetType) {
            return false;
        }
        if (sourceType !== 'object' || targetType !== 'object') {
            return source === target;
        }
        if (source.constructor !== target.constructor) {
            return false;
        }
        const sourceKeys = Object.keys(source);
        const targetKeys = Object.keys(target);
        if (sourceKeys.length !== targetKeys.length) {
            return false;
        }
        for (let i = 0; i < sourceKeys.length; i++) {
            const name = sourceKeys[i];
            if (!match(source[name], target[name]))
                return false;
        }
        return true;
    };
    const index = function (items, item) {
        for (let i = 0; i < items.length; i++) {
            if (match(items[i], item)) {
                return i;
            }
        }
        return -1;
    };

    const methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse'];
    const get = function (tasks, handler, path, target, property) {
        if (isArray(target) && methods.indexOf(property) !== -1) {
            tasks.push(handler.bind(null, target, path.slice(0, -1)));
        }
        return target[property];
    };
    const set = function (tasks, handler, path, target, property, value) {
        if (target[property] === value) {
            return true;
        }
        target[property] = create(value, handler, path + property, tasks);
        if (tasks.length) {
            Promise.resolve().then(() => {
                let task;
                while (task = tasks.shift())
                    task();
            }).catch(console.error);
        }
        return true;
    };
    const create = function (source, handler, path, tasks) {
        path = path || '';
        tasks = tasks || [];
        tasks.push(handler.bind(null, source, path));
        let isNative = false;
        if (isArray(source)) {
            path = path ? path + '.' : '';
            for (let key = 0; key < source.length; key++) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = create(source[key], handler, path + key, tasks);
            }
        }
        else if (isObject(source)) {
            path = path ? path + '.' : '';
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = create(source[key], handler, path + key, tasks);
            }
        }
        else {
            isNative = true;
        }
        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task;
                while (task = tasks.shift())
                    task();
            }).catch(console.error);
        }
        if (isNative)
            return source;
        return new Proxy(source, {
            get: get.bind(get, tasks, handler, path),
            set: set.bind(set, tasks, handler, path)
        });
    };
    const clone = function (source, handler, path, tasks) {
        path = path || '';
        tasks = tasks || [];
        tasks.push(handler.bind(null, source, path));
        let target;
        let isNative = false;
        if (isArray(source)) {
            target = [];
            path = path ? path + '.' : '';
            for (let key = 0; key < source.length; key++) {
                tasks.push(handler.bind(null, source[key], `${path}${key}`));
                target[key] = create(source[key], handler, `${path}${key}`, tasks);
            }
        }
        else if (isObject(source)) {
            target = {};
            path = path ? path + '.' : '';
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], `${path}${key}`));
                target[key] = create(source[key], handler, `${path}${key}`, tasks);
            }
        }
        else {
            isNative = true;
        }
        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task;
                while (task = tasks.shift())
                    task();
            }).catch(console.error);
        }
        if (isNative)
            return source;
        return new Proxy(target, {
            get: get.bind(get, tasks, handler, path),
            set: set.bind(set, tasks, handler, path)
        });
    };
    var Observer = { get, set, create, clone };

    const reads = [];
    const writes = [];
    const options = {
        time: 1000 / 60,
        pending: false
    };
    const setup = function (options = {}) {
        this.options.time = options.time || this.options.time;
    };
    const tick = function (method) {
        return new Promise((resolve, reject) => {
            window.requestAnimationFrame(time => {
                Promise.resolve()
                    .then(method.bind(this, time))
                    .then(resolve)
                    .catch(reject);
            });
        });
    };
    const schedule = function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.options.pending)
                return;
            this.options.pending = true;
            return this.tick(this.flush);
        });
    };
    const flush = function (time) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('reads before:', this.reads.length);
            console.log('write before:', this.writes.length);
            let read;
            while (read = this.reads.shift()) {
                if (read)
                    yield read();
                if ((performance.now() - time) > this.options.time) {
                    console.log('read max');
                    return this.tick(this.flush);
                }
            }
            let write;
            while (write = this.writes.shift()) {
                if (write)
                    yield write();
                if ((performance.now() - time) > this.options.time) {
                    console.log('write max');
                    return this.tick(this.flush);
                }
            }
            console.log('reads after:', this.reads.length);
            console.log('write after:', this.writes.length);
            if (this.reads.length === 0 && this.writes.length === 0) {
                this.options.pending = false;
            }
            else if ((performance.now() - time) > this.options.time) {
                return this.tick(this.flush);
            }
            else {
                return this.flush(time);
            }
        });
    };
    const remove = function (tasks, task) {
        const index = tasks.indexOf(task);
        return !!~index && !!tasks.splice(index, 1);
    };
    const clear = function (task) {
        return this.remove(this.reads, task) || this.remove(this.writes, task);
    };
    const batch = function (context) {
        const self = this;
        if (!context)
            return;
        if (!context.read && !context.write)
            return;
        self.reads.push(() => __awaiter(this, void 0, void 0, function* () { return context.read ? context.read.call(context, context) : undefined; }));
        self.writes.push(() => __awaiter(this, void 0, void 0, function* () { return context.write ? context.write.call(context, context) : undefined; }));
        self.schedule().catch(console.error);
    };
    var Batcher = Object.freeze({
        reads,
        writes,
        options,
        setup,
        tick,
        schedule,
        flush,
        remove,
        clear,
        batch
    });

    function checked (binder, event) {
        if (binder.meta.busy) {
            return;
        }
        else {
            binder.meta.busy = true;
        }
        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.target.addEventListener('input', event => Binder.render(binder, event));
        }
        return {
            read(ctx) {
                ctx.data = binder.data;
                if (isBoolean(ctx.data)) {
                    ctx.checked = event ? binder.target.checked : ctx.data;
                }
                else {
                    ctx.value = binder.getAttribute('value');
                    ctx.checked = match(ctx.data, ctx.value);
                }
                if (event) {
                    if (isBoolean(ctx.data)) {
                        binder.data = ctx.checked;
                    }
                    else {
                        binder.data = ctx.value;
                    }
                    binder.meta.busy = false;
                    ctx.write = false;
                    return;
                }
            },
            write(ctx) {
                binder.target.checked = ctx.checked;
                binder.target.setAttribute('checked', ctx.checked);
                binder.meta.busy = false;
            }
        };
    }

    function Class (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (typeof data !== 'string')
                    data = data ? binder.key : '';
                data = binder.display(data);
                if (data === binder.target.className) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.className = data;
                binder.target.setAttribute('class', data);
            }
        };
    }

    const bools = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];
    function Default (binder) {
        let data, bool;
        return {
            read() {
                data = binder.data;
                bool = bools.includes(binder.type);
                if (bool) {
                    data = data ? true : false;
                }
                else {
                    data = data === null || data === undefined ? '' : data;
                    data = binder.display(data);
                }
            },
            write() {
                binder.target[binder.type] = data;
                if (bool) {
                    if (data)
                        binder.target.setAttribute(binder.type, '');
                    else
                        binder.target.removeAttribute(binder.type);
                }
                else {
                    binder.target.setAttribute(binder.type, data);
                }
            }
        };
    }

    function each (binder) {
        if (binder.meta.busy) {
            console.log('busy each');
            return;
        }
        else {
            binder.meta.busy = true;
        }
        const read = function () {
            if (!binder.meta.setup) {
                binder.meta.keys = [];
                binder.meta.counts = [];
                binder.meta.busy = false;
                binder.meta.setup = false;
                binder.meta.targetLength = 0;
                binder.meta.currentLength = 0;
                binder.meta.templateString = binder.target.innerHTML;
                binder.meta.templateLength = binder.target.childNodes.length;
                while (binder.target.firstChild) {
                    binder.target.removeChild(binder.target.firstChild);
                }
                binder.meta.setup = true;
            }
            binder.meta.keys = Object.keys(binder.data || []);
            binder.meta.targetLength = binder.meta.keys.length;
            if (binder.meta.currentLength === binder.meta.targetLength) {
                binder.meta.busy = false;
                this.write = false;
            }
        };
        const write = function () {
            var _a;
            if (binder.meta.currentLength > binder.meta.targetLength) {
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;
                    while (count--) {
                        const node = binder.target.lastChild;
                        Promise.resolve().then(Binder.remove.bind(Binder, node));
                        binder.target.removeChild(node);
                    }
                    binder.meta.currentLength--;
                }
            }
            else if (binder.meta.currentLength < binder.meta.targetLength) {
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const index = binder.meta.currentLength;
                    const key = binder.meta.keys[index];
                    const variable = `${binder.path}.${key}`;
                    let clone = binder.meta.templateString;
                    const length = binder.names.length > 4 ? 4 : binder.names.length;
                    for (let i = 1; i < length; i++) {
                        const item = new RegExp(`\\b(${binder.names[i]})\\b`, 'g');
                        const syntax = new RegExp(`{{.*?\\b(${binder.names[i]})\\b.*?}}`, 'g');
                        let replace;
                        switch (i) {
                            case 1:
                                replace = variable;
                                break;
                            case 2:
                                replace = index;
                                break;
                            case 3:
                                replace = key;
                                break;
                        }
                        (_a = clone.match(syntax)) === null || _a === void 0 ? void 0 : _a.forEach(match => clone = clone.replace(match, match.replace(item, replace)));
                    }
                    const parsed = new DOMParser().parseFromString(clone, 'text/html').body;
                    let node;
                    while (node = parsed.firstChild) {
                        binder.target.appendChild(node);
                        Promise.resolve().then(Binder.add.bind(Binder, node, binder.container));
                    }
                    binder.meta.currentLength++;
                }
            }
            binder.meta.busy = false;
        };
        return { read, write };
    }

    function html (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === undefined || data === null) {
                    data = '';
                }
                else if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }
                else if (typeof data !== 'string') {
                    data = String(data);
                }
            },
            write() {
                while (binder.target.firstChild) {
                    const node = binder.target.removeChild(binder.target.firstChild);
                    Binder.remove(node);
                }
                const fragment = document.createDocumentFragment();
                const parser = document.createElement('div');
                parser.innerHTML = data;
                while (parser.firstElementChild) {
                    Binder.add(parser.firstElementChild, { container: binder.container });
                    fragment.appendChild(parser.firstElementChild);
                }
                binder.target.appendChild(fragment);
            }
        };
    }

    function on (binder) {
        binder.target[binder.name] = null;
        const name = binder.name.slice(2);
        if (binder.meta.method) {
            binder.target.removeEventListener(name, binder.meta.method);
        }
        binder.meta.method = binder.data;
        binder.target.addEventListener(name, binder.meta.method);
    }

    const reset = function (binder, event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const elements = event.target.querySelectorAll('*');
            for (let i = 0, l = elements.length; i < l; i++) {
                const element = elements[i];
                const name = element.nodeName;
                const type = element.type;
                if (!type && name !== 'TEXTAREA' ||
                    type === 'submit' ||
                    type === 'button' ||
                    !type) {
                    continue;
                }
                const binder = (_a = Binder.get(element)) === null || _a === void 0 ? void 0 : _a.get('value');
                if (!binder) {
                    if (type === 'select-one' || type === 'select-multiple') {
                        element.selectedIndex = null;
                    }
                    else if (type === 'radio' || type === 'checkbox') {
                        element.checked = false;
                    }
                    else {
                        element.value = null;
                    }
                }
                else if (type === 'select-one') {
                    binder.data = null;
                }
                else if (type === 'select-multiple') {
                    binder.data = [];
                }
                else if (type === 'radio' || type === 'checkbox') {
                    binder.data = false;
                }
                else {
                    binder.data = '';
                }
            }
            const method = binder.data;
            if (typeof method === 'function') {
                yield method.call(binder.container, event);
            }
        });
    };
    function reset$1 (binder) {
        if (typeof binder.data !== 'function') {
            console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
            return;
        }
        if (binder.meta.method) {
            binder.target.removeEventListener('reset', binder.meta.method, false);
        }
        binder.meta.method = reset.bind(this, binder);
        binder.target.addEventListener('reset', binder.meta.method, false);
    }

    const submit = function (binder, event) {
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const data = {};
            const elements = event.target.querySelectorAll('*');
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if ((!element.type && element.nodeName !== 'TEXTAREA') ||
                    element.type === 'submit' ||
                    element.type === 'button' ||
                    !element.type)
                    continue;
                const attribute = element.attributes['o-value'];
                const b = Binder.get(attribute);
                console.warn('todo: need to get a value for selects');
                const value = (b ? b.data : (element.files ? (element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0]) : element.value));
                const name = element.name || (b ? b.values[b.values.length - 1] : null);
                if (!name)
                    continue;
                data[name] = value;
            }
            const method = binder.data;
            if (typeof method === 'function') {
                yield method.call(binder.container, data, event);
            }
            if (binder.getAttribute('reset')) {
                event.target.reset();
            }
        });
    };
    function submit$1 (binder) {
        binder.target.submit = null;
        if (typeof binder.data !== 'function') {
            console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
            return;
        }
        if (binder.meta.method) {
            binder.target.removeEventListener('submit', binder.meta.method);
        }
        binder.meta.method = submit.bind(this, binder);
        binder.target.addEventListener('submit', binder.meta.method);
    }

    function text (binder) {
        let data;
        return {
            read() {
                data = toString(binder.data);
                if (data === binder.target.textContent) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.textContent = data;
            }
        };
    }

    const input = function (binder) {
        const type = binder.target.type;
        if (type === 'select-one' || type === 'select-multiple') ;
        else if (type === 'checkbox' || type === 'radio') {
            binder.data = to(binder.data, binder.target.value);
        }
        else if (type === 'number') {
            binder.data = toNumber(binder.target.value);
        }
        else if (type === 'file') {
            const multiple = binder.target.multiple;
            binder.data = multiple ? [...binder.target.files] : binder.target.files[0];
        }
        else {
            binder.data = binder.target.value;
        }
    };
    function value (binder, event) {
        const type = binder.target.type;
        if (binder.meta.busy) {
            console.log('busy value');
            return;
        }
        else {
            binder.meta.busy = true;
        }
        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.target.addEventListener('input', () => input(binder));
        }
        if (type === 'select-one' || type === 'select-multiple') {
            return {
                read(ctx) {
                    console.log(event);
                    console.log(binder.target);
                    console.log(binder.data);
                    ctx.selectBinder = binder;
                    ctx.select = binder.target;
                    ctx.options = binder.target.options;
                    ctx.multiple = binder.target.multiple;
                    if (ctx.multiple && binder.data instanceof Array === false) {
                        ctx.data = binder.data = [];
                    }
                    else {
                        ctx.data = binder.data;
                    }
                    ctx.selects = [];
                    ctx.unselects = [];
                    for (let i = 0; i < ctx.options.length; i++) {
                        const node = ctx.options[i];
                        const selected = node.selected;
                        const attribute = node.attributes['o-value'] || node.attributes['value'];
                        const option = Binder.get(attribute) || { get data() { return node.value; }, set data(data) { node.value = data; } };
                        if (ctx.multiple) {
                            const index$1 = index(binder.data, option.data);
                            if (event) {
                                if (selected && index$1 === -1) {
                                    binder.data.push(option.data);
                                }
                                else if (!selected && index$1 !== -1) {
                                    binder.data.splice(index$1, 1);
                                }
                            }
                            else {
                                if (index$1 === -1) {
                                    ctx.unselects.push(node);
                                }
                                else {
                                    ctx.selects.push(node);
                                }
                            }
                        }
                        else {
                            const match$1 = match(binder.data, option.data);
                            if (event) {
                                if (selected && !match$1) {
                                    binder.data = option.data;
                                }
                                else if (!selected && match$1) {
                                    continue;
                                }
                            }
                            else {
                                if (match$1) {
                                    ctx.selects.push(node);
                                }
                                else {
                                    ctx.unselects.push(node);
                                }
                            }
                        }
                    }
                },
                write(ctx) {
                    const { selects, unselects } = ctx;
                    selects.forEach(option => {
                        option.selected = true;
                        console.log(option, option.selected, 'select');
                    });
                    unselects.forEach(option => {
                        option.selected = false;
                        console.log(option, option.selected, 'unselects');
                    });
                    binder.meta.busy = false;
                }
            };
        }
        else if (type === 'checkbox' || type === 'radio') {
            return {
                read(ctx) {
                    ctx.data = binder.data;
                },
                write(ctx) {
                    ctx.value = toString(ctx.data);
                    binder.target.value = ctx.value;
                    binder.target.setAttribute('value', ctx.value);
                    binder.meta.busy = false;
                }
            };
        }
        else if (type === 'number') {
            return {
                read(ctx) {
                    ctx.data = binder.data;
                    ctx.value = toNumber(binder.target.value);
                },
                write(ctx) {
                    ctx.value = toString(ctx.data);
                    binder.target.value = ctx.value;
                    binder.target.setAttribute('value', ctx.value);
                    binder.meta.busy = false;
                }
            };
        }
        else if (type === 'file') {
            return {
                read(ctx) {
                    ctx.data = binder.data;
                    ctx.multiple = binder.target.multiple;
                    ctx.value = ctx.multiple ? [...binder.target.files] : binder.target.files[0];
                }
            };
        }
        else {
            return {
                read(ctx) {
                    ctx.data = binder.data;
                    ctx.value = binder.target.value;
                },
                write(ctx) {
                    var _a;
                    binder.target.value = (_a = ctx.data) !== null && _a !== void 0 ? _a : '';
                    binder.meta.busy = false;
                }
            };
        }
    }

    const PARAMETER_PATTERNS = /{{[._$a-zA-Z0-9,\(\)\[\] ]+}}/g;
    const TN = Node.TEXT_NODE;
    const EN = Node.ELEMENT_NODE;
    var Binder = new class Binder {
        constructor() {
            this.data = new Map();
            this.prefix = 'o-';
            this.syntaxEnd = '}}';
            this.syntaxStart = '{{';
            this.prefixReplace = new RegExp('^o-');
            this.syntaxReplace = new RegExp('{{|}}', 'g');
            this.binders = {
                checked,
                class: Class,
                each,
                default: Default,
                html,
                on,
                reset: reset$1,
                submit: submit$1,
                text,
                value,
            };
        }
        setup(options = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                const { binders } = options;
                if (binders) {
                    for (const name in binders) {
                        if (name in this.binders === false) {
                            this.binders[name] = binders[name].bind(this);
                        }
                    }
                }
            });
        }
        get(node) {
            return this.data.get(node);
        }
        render(binder, ...extra) {
            const type = binder.type in this.binders ? binder.type : 'default';
            const render = this.binders[type](binder, ...extra);
            if (render)
                Batcher.batch(render);
        }
        unbind(node) {
            return this.data.delete(node);
        }
        bind(target, name, value, container, pointer) {
            const self = this;
            const parameters = value.match(PARAMETER_PATTERNS);
            if (!parameters)
                return console.error(`Oxe.binder.bind - value ${value} is not valid`);
            const paths = parameters.map(path => path.replace(this.syntaxReplace, ''));
            const names = name.split('-');
            const meta = {};
            const type = name.startsWith('on') ? 'on' : name;
            paths.forEach((path, index) => {
                const keys = path.split('.');
                const [key] = keys.slice(-1);
                const parameter = parameters[index];
                const childKey = keys.slice(-1)[0];
                const parentKeys = keys.slice(0, -1);
                const binder = Object.freeze({
                    key, keys,
                    value,
                    name, names,
                    path, paths,
                    parameter, parameters,
                    meta,
                    type,
                    target, container,
                    render: self.render,
                    childKey,
                    parentKeys,
                    display(data) {
                        let value = this.value;
                        parameters.forEach(parameter => {
                            value = value.replace(parameter, parameter === this.parameter ? data : traverse(container.model, parameter.replace(/{{|}}/, '').split('.')));
                        });
                        return value;
                    },
                    getAttribute(name) {
                        var _a, _b;
                        const node = target.getAttributeNode(name);
                        if (!node)
                            return undefined;
                        const data = (_b = (_a = self.data) === null || _a === void 0 ? void 0 : _a.get(node)) === null || _b === void 0 ? void 0 : _b.data;
                        return data === undefined ? node.value : data;
                    },
                    get data() {
                        const parentValue = traverse(this.container.model, this.parentKeys);
                        const childValue = parentValue[this.childKey];
                        if (typeof childValue === 'function') {
                            return event => {
                                return childValue.call(this.container, event, ...parameters);
                            };
                        }
                        else {
                            return childValue;
                        }
                    },
                    set data(value) {
                        const parentValue = traverse(container.model, this.parentKeys);
                        const childValue = parentValue[this.childKey];
                        if (this.type === 'on') {
                            parentValue[this.childKey] = value;
                        }
                        else if (typeof childValue === 'function') {
                            const parameters = this.parameterPaths.map(path => traverse(container.model, path));
                            childValue.call(this.container, ...parameters);
                        }
                        else {
                            parentValue[this.childKey] = value;
                        }
                    }
                });
                this.data.set(pointer, binder);
                if (target.nodeName.includes('-')) {
                    window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
                }
                else {
                    this.render(binder);
                }
            });
        }
        remove(node) {
            const type = node.nodeType;
            if (type === EN) {
                const attributes = node.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    this.unbind(attribute);
                }
            }
            this.unbind(node);
            let child = node.firstChild;
            while (child) {
                this.remove(child);
                child = child.nextSibling;
            }
        }
        add(node, container) {
            const type = node.nodeType;
            if (type === TN) {
                const start = node.textContent.indexOf(this.syntaxStart);
                if (start === -1)
                    return;
                if (start !== 0)
                    node = node.splitText(start);
                const end = node.textContent.indexOf(this.syntaxEnd);
                if (end === -1)
                    return;
                if (end + this.syntaxStart.length !== node.textContent.length) {
                    const split = node.splitText(end + this.syntaxEnd.length);
                    this.bind(node, 'text', node.textContent, container, node);
                    this.add(split, container);
                }
                else {
                    this.bind(node, 'text', node.textContent, container, node);
                }
            }
            else if (type === EN) {
                let skip = false;
                const attributes = node.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    const { name, value } = attribute;
                    if (name.indexOf(this.prefix) === 0
                        ||
                            (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1)
                        ||
                            (value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1)) {
                        if (name.indexOf('each') === 0
                            ||
                                name.indexOf(`${this.prefix}each`) === 0) {
                            skip = true;
                        }
                        this.bind(node, name, value, container, attribute);
                    }
                }
                if (skip)
                    return;
                let child = node.firstChild;
                while (child) {
                    this.add(child, container);
                    child = child.nextSibling;
                }
            }
        }
    };

    var _data, _style, _support, _a;
    var Css = new (_a = class Css {
            constructor() {
                _data.set(this, new Map());
                _style.set(this, document.createElement('style'));
                _support.set(this, !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)'));
                __classPrivateFieldGet(this, _style).appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
                __classPrivateFieldGet(this, _style).setAttribute('title', 'oxe');
                document.head.appendChild(__classPrivateFieldGet(this, _style));
            }
            scope(name, text) {
                return text
                    .replace(/\t|\n\s*/g, '')
                    .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
                    .replace(/:host/g, name);
            }
            transform(text = '') {
                if (!__classPrivateFieldGet(this, _support)) {
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
                const item = __classPrivateFieldGet(this, _data).get(name);
                if (!item || item.count === 0)
                    return;
                item.count--;
                if (item.count === 0 && __classPrivateFieldGet(this, _style).contains(item.node)) {
                    __classPrivateFieldGet(this, _style).removeChild(item.node);
                }
            }
            attach(name, text) {
                const item = __classPrivateFieldGet(this, _data).get(name) || { count: 0, node: this.node(name, text) };
                if (item) {
                    item.count++;
                }
                else {
                    __classPrivateFieldGet(this, _data).set(name, item);
                }
                if (!__classPrivateFieldGet(this, _style).contains(item.node)) {
                    __classPrivateFieldGet(this, _style).appendChild(item.node);
                }
            }
            node(name, text) {
                return document.createTextNode(this.scope(name, this.transform(text)));
            }
        },
        _data = new WeakMap(),
        _style = new WeakMap(),
        _support = new WeakMap(),
        _a);

    var _CREATED, _css, _binder, _root, _name, _model, _adopt, _shadow, _adopted, _created, _attached, _detached, _attributed;
    class Component extends HTMLElement {
        constructor() {
            super();
            _CREATED.set(this, void 0);
            _css.set(this, Css);
            _binder.set(this, Binder);
            _root.set(this, void 0);
            _name.set(this, void 0);
            _model.set(this, void 0);
            _adopt.set(this, void 0);
            _shadow.set(this, void 0);
            _adopted.set(this, void 0);
            _created.set(this, void 0);
            _attached.set(this, void 0);
            _detached.set(this, void 0);
            _attributed.set(this, void 0);
            __classPrivateFieldSet(this, _adopt, typeof this.constructor.adopt === 'boolean' ? this.constructor.adopt.bind(this) : false);
            __classPrivateFieldSet(this, _shadow, typeof this.constructor.shadow === 'boolean' ? this.constructor.shadow.bind(this) : false);
            __classPrivateFieldSet(this, _adopted, typeof this.constructor.adopted === 'function' ? this.constructor.adopted.bind(this) : function () { });
            __classPrivateFieldSet(this, _created, typeof this.constructor.created === 'function' ? this.constructor.created.bind(this) : function () { });
            __classPrivateFieldSet(this, _attached, typeof this.constructor.attached === 'function' ? this.constructor.attached.bind(this) : function () { });
            __classPrivateFieldSet(this, _detached, typeof this.constructor.detached === 'function' ? this.constructor.detached.bind(this) : function () { });
            __classPrivateFieldSet(this, _attributed, typeof this.constructor.attributed === 'function' ? this.constructor.attributed.bind(this) : function () { });
            __classPrivateFieldSet(this, _name, this.nodeName.toLowerCase());
            __classPrivateFieldSet(this, _model, Observer.clone(this.constructor.model, (data, path) => {
                Binder.data.forEach(binder => {
                    if (binder.container === this && binder.path.startsWith(path)) {
                        Binder.render(binder);
                    }
                });
            }));
        }
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        get css() { return __classPrivateFieldGet(this, _css); }
        get root() { return __classPrivateFieldGet(this, _root); }
        get model() { return __classPrivateFieldGet(this, _model); }
        get binder() { return __classPrivateFieldGet(this, _binder); }
        sloted(template) {
            return __awaiter(this, void 0, void 0, function* () {
                const templateSlots = template.querySelectorAll('slot[name]');
                const defaultSlot = template.querySelector('slot:not([name])');
                for (let i = 0; i < templateSlots.length; i++) {
                    const templateSlot = templateSlots[i];
                    const name = templateSlot.getAttribute('name');
                    const instanceSlot = this.querySelector('[slot="' + name + '"]');
                    if (instanceSlot) {
                        templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
                    }
                    else {
                        templateSlot.parentNode.removeChild(templateSlot);
                    }
                }
                if (this.children.length) {
                    while (this.firstChild) {
                        if (defaultSlot) {
                            defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
                        }
                        else {
                            this.removeChild(this.firstChild);
                        }
                    }
                }
                if (defaultSlot) {
                    defaultSlot.parentNode.removeChild(defaultSlot);
                }
            });
        }
        render() {
            return __awaiter(this, void 0, void 0, function* () {
                if (__classPrivateFieldGet(this, _adopt) === true) {
                    let child = this.firstElementChild;
                    while (child) {
                        Binder.add(child, this);
                        child = child.nextElementSibling;
                    }
                }
                const template = document.createElement('template');
                template.innerHTML = this.constructor.template;
                const clone = template.content.cloneNode(true);
                if (__classPrivateFieldGet(this, _shadow) && 'attachShadow' in document.body) {
                    __classPrivateFieldSet(this, _root, this.attachShadow({ mode: 'open' }));
                }
                else if (__classPrivateFieldGet(this, _shadow) && 'createShadowRoot' in document.body) {
                    __classPrivateFieldSet(this, _root, this.createShadowRoot());
                }
                else {
                    this.sloted(clone);
                    __classPrivateFieldSet(this, _root, this);
                }
                let child = clone.firstElementChild;
                while (child) {
                    Binder.add(child, this);
                    __classPrivateFieldGet(this, _root).appendChild(child);
                    child = clone.firstElementChild;
                }
            });
        }
        attributeChangedCallback(name, oldValue, newValue) {
            return __awaiter(this, void 0, void 0, function* () {
                yield __classPrivateFieldGet(this, _attributed).call(this, name, oldValue, newValue);
            });
        }
        adoptedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                yield __classPrivateFieldGet(this, _adopted).call(this);
            });
        }
        disconnectedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                __classPrivateFieldGet(this, _css).detach(__classPrivateFieldGet(this, _name));
                yield __classPrivateFieldGet(this, _detached).call(this);
            });
        }
        connectedCallback() {
            return __awaiter(this, void 0, void 0, function* () {
                __classPrivateFieldGet(this, _css).attach(__classPrivateFieldGet(this, _name), this.constructor.css);
                if (__classPrivateFieldGet(this, _CREATED)) {
                    yield __classPrivateFieldGet(this, _attached).call(this);
                }
                else {
                    __classPrivateFieldSet(this, _CREATED, true);
                    this.render();
                    yield __classPrivateFieldGet(this, _created).call(this);
                    yield __classPrivateFieldGet(this, _attached).call(this);
                }
            });
        }
    }
    _CREATED = new WeakMap(), _css = new WeakMap(), _binder = new WeakMap(), _root = new WeakMap(), _name = new WeakMap(), _model = new WeakMap(), _adopt = new WeakMap(), _shadow = new WeakMap(), _adopted = new WeakMap(), _created = new WeakMap(), _attached = new WeakMap(), _detached = new WeakMap(), _attributed = new WeakMap();
    Component.template = '';
    Component.model = {};
    Component.attributes = [];

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
            const nameImport = importMatch[1];
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
            if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
                yield run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
                window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
            }
            if (window.DYNAMIC_SUPPORT === true) {
                console.log('native import');
                yield run(`window.MODULES["${url}"] = import("${url}");`);
                return window.MODULES[url];
            }
            if (window.MODULES[url]) {
                return window.MODULES[url];
            }
            if (typeof window.REGULAR_SUPPORT !== 'boolean') {
                const script = document.createElement('script');
                window.REGULAR_SUPPORT = 'noModule' in script;
            }
            let code;
            if (window.REGULAR_SUPPORT) {
                console.log('noModule: yes');
                code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
            }
            else {
                console.log('noModule: no');
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

    var _target, _data$1, _folder, _dynamic, _contain, _external, _after, _before, _a$1;
    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Location = new (_a$1 = class Location {
            constructor() {
                _target.set(this, void 0);
                _data$1.set(this, {});
                _folder.set(this, '');
                _dynamic.set(this, true);
                _contain.set(this, false);
                _external.set(this, void 0);
                _after.set(this, void 0);
                _before.set(this, void 0);
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
            toString() { return window.location.href; }
            back() { window.history.back(); }
            forward() { window.history.forward(); }
            reload() { window.location.reload(); }
            redirect(href) { window.location.href = href; }
            listen(option) {
                return __awaiter(this, void 0, void 0, function* () {
                    if ('folder' in option)
                        __classPrivateFieldSet(this, _folder, option.folder);
                    if ('contain' in option)
                        __classPrivateFieldSet(this, _contain, option.contain);
                    if ('dynamic' in option)
                        __classPrivateFieldSet(this, _dynamic, option.dynamic);
                    if ('external' in option)
                        __classPrivateFieldSet(this, _external, option.external);
                    __classPrivateFieldSet(this, _target, option.target instanceof Element ? option.target : document.body.querySelector(option.target));
                    if (__classPrivateFieldGet(this, _dynamic)) {
                        window.addEventListener('popstate', this.state.bind(this), true);
                        if (__classPrivateFieldGet(this, _contain)) {
                            __classPrivateFieldGet(this, _target).addEventListener('click', this.click.bind(this), true);
                        }
                        else {
                            window.document.addEventListener('click', this.click.bind(this), true);
                        }
                    }
                    return this.replace(window.location.href);
                });
            }
            assign(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return this.go(data, { mode: 'push' });
                });
            }
            replace(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return this.go(data, { mode: 'replace' });
                });
            }
            location(href = window.location.href) {
                const parser = document.createElement('a');
                parser.href = href;
                return {
                    href: parser.href,
                    host: parser.host,
                    port: parser.port,
                    hash: parser.hash,
                    search: parser.search,
                    protocol: parser.protocol,
                    hostname: parser.hostname,
                    pathname: parser.pathname
                };
            }
            go(path, options = {}) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { mode } = options;
                    const location = this.location(path);
                    if (__classPrivateFieldGet(this, _before))
                        yield __classPrivateFieldGet(this, _before).call(this, location);
                    if (!__classPrivateFieldGet(this, _dynamic)) {
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
                    let element;
                    if (location.pathname in __classPrivateFieldGet(this, _data$1)) {
                        element = __classPrivateFieldGet(this, _data$1)[location.pathname];
                    }
                    else {
                        const path = location.pathname === '/' ? '/index' : location.pathname;
                        let load$1 = path;
                        if (load$1.slice(0, 2) === './')
                            load$1 = load$1.slice(2);
                        if (load$1.slice(0, 1) !== '/')
                            load$1 = '/' + load$1;
                        if (load$1.slice(0, 1) === '/')
                            load$1 = load$1.slice(1);
                        load$1 = `${__classPrivateFieldGet(this, _folder)}/${load$1}.js`.replace(/\/+/g, '/');
                        load$1 = absolute(load$1);
                        const component = (yield load(load$1)).default;
                        const name = 'l' + path.replace(/\/+/g, '-');
                        window.customElements.define(name, component);
                        element = window.document.createElement(name);
                        __classPrivateFieldGet(this, _data$1)[location.pathname] = element;
                    }
                    if (element.title)
                        window.document.title = element.title;
                    while (__classPrivateFieldGet(this, _target).firstChild) {
                        __classPrivateFieldGet(this, _target).removeChild(__classPrivateFieldGet(this, _target).firstChild);
                    }
                    __classPrivateFieldGet(this, _target).appendChild(element);
                    if (__classPrivateFieldGet(this, _after))
                        yield __classPrivateFieldGet(this, _after).call(this, location);
                });
            }
            state(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield this.replace(event.state.href);
                    window.scroll(event.state.top, 0);
                });
            }
            click(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (event.target.type ||
                        event.button !== 0 ||
                        event.defaultPrevented ||
                        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
                        return;
                    let target = event.path ? event.path[0] : event.target;
                    let parent = target.parentElement;
                    if (__classPrivateFieldGet(this, _contain)) {
                        while (parent) {
                            if (parent.nodeName === __classPrivateFieldGet(this, _target).nodeName) {
                                break;
                            }
                            else {
                                parent = parent.parentElement;
                            }
                        }
                        if (parent.nodeName !== __classPrivateFieldGet(this, _target).nodeName) {
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
                        !target.href.startsWith(window.location.origin))
                        return;
                    if (__classPrivateFieldGet(this, _external) &&
                        (__classPrivateFieldGet(this, _external) instanceof RegExp && __classPrivateFieldGet(this, _external).test(target.href) ||
                            typeof __classPrivateFieldGet(this, _external) === 'function' && __classPrivateFieldGet(this, _external).call(this, target.href) ||
                            typeof __classPrivateFieldGet(this, _external) === 'string' && __classPrivateFieldGet(this, _external) === target.href))
                        return;
                    event.preventDefault();
                    this.assign(target.href);
                });
            }
        },
        _target = new WeakMap(),
        _data$1 = new WeakMap(),
        _folder = new WeakMap(),
        _dynamic = new WeakMap(),
        _contain = new WeakMap(),
        _external = new WeakMap(),
        _after = new WeakMap(),
        _before = new WeakMap(),
        _a$1);

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
                this.option.request = option.request;
                this.option.headers = option.headers;
                this.option.response = option.response;
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
                    throw new Error('Oxe.fetcher - requires method option');
                if (!context.url)
                    throw new Error('Oxe.fetcher - requires url or origin and path option');
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
                if (typeof option.request === 'function')
                    yield option.request(context);
                if (context.aborted)
                    return;
                if (context.body) {
                    if (context.method === 'GET') {
                        context.url = context.url + '?' + (yield this.serialize(context.body));
                    }
                    else if (context.contentType === 'json') {
                        context.body = JSON.stringify(context.body);
                    }
                }
                const result = yield window.fetch(context.url, context);
                Object.defineProperties(context, {
                    result: { enumerable: true, value: result },
                    code: { enumerable: true, value: result.status }
                });
                if (!context.responseType) {
                    context.body = result.body;
                }
                else {
                    const responseType = context.responseType === 'buffer' ? 'arrayBuffer' : context.responseType || '';
                    const contentType = result.headers.get('content-type') || result.headers.get('Content-Type') || '';
                    let type;
                    if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                        type = 'json';
                    }
                    else {
                        type = responseType || 'text';
                    }
                    if (this.types.indexOf(type) === -1) {
                        throw new Error('Oxe.fetch - invalid responseType value');
                    }
                    context.body = yield result[type]();
                }
                if (typeof option.response === 'function')
                    yield option.response(context);
                if (context.aborted)
                    return;
                return context;
            });
        }
    };

    function Define(component) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof component === 'string') {
                return Promise.resolve()
                    .then(() => load(component))
                    .then(data => Define(data.default));
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
    if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
        window.Reflect = window.Reflect || {};
        window.Reflect.construct = function construct(parent, args, child) {
            var target = child === undefined ? parent : child;
            var prototype = Object.create(target.prototype || Object.prototype);
            return Function.prototype.apply.call(parent, prototype, args) || prototype;
        };
    }
    if (!window.String.prototype.startsWith) {
        Object.defineProperty(window.String.prototype, 'startsWith', {
            value: function (search, rawPos) {
                var pos = rawPos > 0 ? rawPos | 0 : 0;
                return this.substring(pos, pos + search.length) === search;
            }
        });
    }
    var index$1 = Object.freeze(new class Oxe {
        constructor() {
            this.Component = Component;
            this.component = Component;
            this.Location = Location;
            this.location = Location;
            this.Batcher = Batcher;
            this.batcher = Batcher;
            this.Fetcher = Fetcher;
            this.fetcher = Fetcher;
            this.Binder = Binder;
            this.binder = Binder;
            this.Define = Define;
            this.define = Define;
            this.Load = load;
            this.load = load;
            this.Css = Css;
            this.css = Css;
        }
    });

    return index$1;

})));
