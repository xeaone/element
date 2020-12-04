
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

    const methods = ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse'];
    const get = function (tasks, handler, path, target, property) {
        if (target instanceof Array && methods.indexOf(property) !== -1) {
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
        if (source instanceof Object === false && source instanceof Array === false) {
            if (!path && tasks.length) {
                Promise.resolve().then(() => {
                    let task;
                    while (task = tasks.shift())
                        task();
                }).catch(console.error);
            }
            return source;
        }
        path = path ? path + '.' : '';
        if (source instanceof Array) {
            for (let key = 0; key < source.length; key++) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = create(source[key], handler, path + key, tasks);
            }
        }
        else if (source instanceof Object) {
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = create(source[key], handler, path + key, tasks);
            }
        }
        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task;
                while (task = tasks.shift())
                    task();
            }).catch(console.error);
        }
        return new Proxy(source, {
            get: get.bind(get, tasks, handler, path),
            set: set.bind(set, tasks, handler, path)
        });
    };
    const clone = function (source, handler, path, tasks) {
        path = path || '';
        tasks = tasks || [];
        tasks.push(handler.bind(null, source, path));
        if (source instanceof Object === false && source instanceof Array === false) {
            if (!path && tasks.length) {
                Promise.resolve().then(() => {
                    let task;
                    while (task = tasks.shift())
                        task();
                }).catch(console.error);
            }
            return source;
        }
        let target;
        path = path ? path + '.' : '';
        if (source instanceof Array) {
            target = [];
            for (let key = 0; key < source.length; key++) {
                tasks.push(handler.bind(null, source[key], `${path}${key}`));
                target[key] = create(source[key], handler, `${path}${key}`, tasks);
            }
        }
        else if (source instanceof Object) {
            target = {};
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], `${path}${key}`));
                target[key] = create(source[key], handler, `${path}${key}`, tasks);
            }
        }
        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task;
                while (task = tasks.shift())
                    task();
            }).catch(console.error);
        }
        return new Proxy(target, {
            get: get.bind(get, tasks, handler, path),
            set: set.bind(set, tasks, handler, path)
        });
    };
    var Observer = { get, set, create, clone };

    function Traverse(data, path, end) {
        const keys = typeof path === 'string' ? path.split('.') : path;
        const length = keys.length - (end || 0);
        let result = data;
        for (let index = 0; index < length; index++) {
            result = result[keys[index]];
        }
        return result;
    }

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

    function Match(source, target) {
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
            const match = Match(source[name], target[name]);
            if (!match)
                return false;
        }
        return true;
    }

    const isMap = data => (data === null || data === void 0 ? void 0 : data.constructor) === Map;
    const isDate = data => (data === null || data === void 0 ? void 0 : data.constructor) === Date;
    const isArray = data => (data === null || data === void 0 ? void 0 : data.constructor) === Array;
    const isString = data => (data === null || data === void 0 ? void 0 : data.constructor) === String;
    const isNumber = data => (data === null || data === void 0 ? void 0 : data.constructor) === Number;
    const isObject = data => (data === null || data === void 0 ? void 0 : data.constructor) === Object;
    const isBoolean = data => (data === null || data === void 0 ? void 0 : data.constructor) === Boolean;
    const toArray = data => JSON.parse(data);
    const toObject = data => JSON.parse(data);
    const toDate = data => new Date(Number(data));
    const toMap = data => new Map(JSON.parse(data));
    const toBoolean = data => data === 'true';
    const toString = data => typeof data === 'string' ? data : JSON.stringify(data);
    const toNumber = data => data === '' || typeof data !== 'string' && typeof data !== 'number' ? NaN : Number(data);
    const to = function (source, target) {
        try {
            if (isMap(source))
                return toMap(target);
            else if (isDate(source))
                return toDate(target);
            else if (isArray(source))
                return toArray(target);
            else if (isString(source))
                return toString(target);
            else if (isObject(source))
                return toObject(target);
            else if (isNumber(source))
                return toNumber(target);
            else if (isBoolean(source))
                return toBoolean(target);
        }
        catch (_a) {
            return target;
        }
    };

    function Checked (binder, event) {
        if (binder.meta.busy) {
            return;
        }
        else {
            binder.meta.busy = true;
        }
        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.target.addEventListener('input', event => Binder$1.render(binder, event));
        }
        return {
            read(ctx) {
                ctx.data = binder.data;
                if (isBoolean(ctx.data)) {
                    ctx.checked = event ? binder.target.checked : ctx.data;
                }
                else {
                    ctx.value = binder.getAttribute('value');
                    ctx.checked = Match(ctx.data, ctx.value);
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
        let data, name;
        return {
            read() {
                data = binder.data;
                if (binder.names.length > 1) {
                    name = binder.names.slice(1).join('-');
                }
            },
            write() {
                if (data === undefined || data === null) {
                    if (name) {
                        binder.target.classList.remove(name);
                    }
                    else {
                        binder.target.setAttribute('class', '');
                    }
                }
                else {
                    if (name) {
                        binder.target.classList.toggle(name, data);
                    }
                    else {
                        binder.target.setAttribute('class', data);
                    }
                }
            }
        };
    }

    function Default (binder) {
        let data;
        return {
            read() {
                data = toString(binder.data);
                if (data === binder.target[binder.type]) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target[binder.type] = data;
                binder.target.setAttribute(binder.type, data);
            }
        };
    }

    function Disable (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === binder.target.disabled) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.disabled = data;
                binder.target.setAttribute('disabled', data);
            }
        };
    }

    function Each (binder) {
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
                        Promise.resolve().then(() => Binder$1.remove(node));
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
                        Promise.resolve().then(() => Binder$1.add(node, binder.container));
                    }
                    binder.meta.currentLength++;
                }
            }
            binder.meta.busy = false;
        };
        return { read, write };
    }

    function Enable (binder) {
        let data;
        return {
            read() {
                data = !binder.data;
                if (data === binder.target.disabled) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.disabled = data;
                binder.target.setAttribute('disabled', data);
            }
        };
    }

    function Hide (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === binder.target.hidden) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.hidden = data;
                binder.target.setAttribute('hidden', data);
            }
        };
    }

    function Href (binder) {
        let data;
        return {
            read() {
                data = binder.data || '';
                if (data === binder.target.href) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.href = data;
                binder.target.setAttribute('href', data);
            }
        };
    }

    function Html (binder) {
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
                    Binder$1.remove(node);
                }
                const fragment = document.createDocumentFragment();
                const parser = document.createElement('div');
                parser.innerHTML = data;
                while (parser.firstElementChild) {
                    Binder$1.add(parser.firstElementChild, {
                        container: binder.container,
                    });
                    fragment.appendChild(parser.firstElementChild);
                }
                binder.target.appendChild(fragment);
            }
        };
    }

    function On (binder) {
        const type = binder.names[1];
        binder.target[`on${type}`] = null;
        if (binder.meta.method) {
            binder.target.removeEventListener(type, binder.meta.method);
        }
        binder.meta.method = event => {
            binder.data.call(binder.container, event);
        };
        binder.target.addEventListener(type, binder.meta.method);
    }

    function Read (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === binder.target.readOnly) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.readOnly = data;
                binder.target.setAttribute('readonly', data);
            }
        };
    }

    function Require (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === binder.target.required) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.required = data;
                binder.target.setAttribute('required', data);
            }
        };
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
                const binder = (_a = Binder$1.get(element)) === null || _a === void 0 ? void 0 : _a.get('value');
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
    function Reset (binder) {
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

    function Show (binder) {
        let data;
        return {
            read() {
                data = !binder.data;
                if (data === binder.target.hidden) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.hidden = data;
                binder.target.setAttribute('hidden', data);
            }
        };
    }

    function Style (binder) {
        let data, name, names;
        return {
            read() {
                data = binder.data;
                if (binder.names.length > 1) {
                    name = '';
                    names = binder.names.slice(1);
                    for (let i = 0, l = names.length; i < l; i++) {
                        if (i === 0) {
                            name = names[i].toLowerCase();
                        }
                        else {
                            name += names[i].charAt(0).toUpperCase() + names[i].slice(1).toLowerCase();
                        }
                    }
                }
            },
            write() {
                if (binder.names.length > 1) {
                    if (data) {
                        binder.target.style[name] = data;
                    }
                    else {
                        binder.target.style[name] = '';
                    }
                }
                else {
                    if (data) {
                        binder.target.style.cssText = data;
                    }
                    else {
                        binder.target.style.cssText = '';
                    }
                }
            }
        };
    }

    const submit = function (binder, event) {
        return __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const data = {};
            const elements = event.target.querySelectorAll('*');
            for (let i = 0, l = elements.length; i < l; i++) {
                const element = elements[i];
                if ((!element.type && element.nodeName !== 'TEXTAREA') ||
                    element.type === 'submit' ||
                    element.type === 'button' ||
                    !element.type)
                    continue;
                const attribute = element.attributes['o-value'];
                const b = Binder$1.get(attribute);
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
    function Submit (binder) {
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

    function Text (binder) {
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

    function Index(items, item) {
        for (let i = 0; i < items.length; i++) {
            if (Match(items[i], item)) {
                return i;
            }
        }
        return -1;
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
    function Value (binder, event) {
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
                        const option = Binder$1.get(attribute) || { get data() { return node.value; }, set data(data) { node.value = data; } };
                        if (ctx.multiple) {
                            const index = Index(binder.data, option.data);
                            if (event) {
                                if (selected && index === -1) {
                                    binder.data.push(option.data);
                                }
                                else if (!selected && index !== -1) {
                                    binder.data.splice(index, 1);
                                }
                            }
                            else {
                                if (index === -1) {
                                    ctx.unselects.push(node);
                                }
                                else {
                                    ctx.selects.push(node);
                                }
                            }
                        }
                        else {
                            const match = Match(binder.data, option.data);
                            if (event) {
                                if (selected && !match) {
                                    binder.data = option.data;
                                }
                                else if (!selected && match) {
                                    continue;
                                }
                            }
                            else {
                                if (match) {
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

    function Write (binder) {
        let data;
        return {
            read() {
                data = !binder.data;
                if (data === binder.target.readOnly) {
                    this.write = false;
                    return;
                }
            },
            write() {
                binder.target.readOnly = data;
                binder.target.setAttribute('readonly', data);
            }
        };
    }

    const PIPE = /\s?\|\s?/;
    const PIPES = /\s?,\s?|\s+/;
    const VARIABLE_PATTERNS = /[._$a-zA-Z0-9[\]]+/g;
    const Binder = {};
    const properties = {
        data: new Map(),
        prefix: 'o-',
        syntaxEnd: '}}',
        syntaxStart: '{{',
        prefixReplace: new RegExp('^o-'),
        syntaxReplace: new RegExp('{{|}}', 'g'),
        binders: {
            checked: Checked.bind(Binder),
            class: Class.bind(Binder),
            css: Style.bind(Binder),
            default: Default.bind(Binder),
            disable: Disable.bind(Binder),
            disabled: Disable.bind(Binder),
            each: Each.bind(Binder),
            enable: Enable.bind(Binder),
            enabled: Enable.bind(Binder),
            hide: Hide.bind(Binder),
            hidden: Hide.bind(Binder),
            href: Href.bind(Binder),
            html: Html.bind(Binder),
            on: On.bind(Binder),
            read: Read.bind(Binder),
            require: Require.bind(Binder),
            required: Require.bind(Binder),
            reset: Reset.bind(Binder),
            show: Show.bind(Binder),
            showed: Show.bind(Binder),
            style: Style.bind(Binder),
            submit: Submit.bind(Binder),
            text: Text.bind(Binder),
            value: Value.bind(Binder),
            write: Write.bind(Binder)
        },
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
        },
        get(node) {
            return this.data.get(node);
        },
        render(binder, ...extra) {
            const type = binder.type in this.binders ? binder.type : 'default';
            const render = this.binders[type](binder, ...extra);
            Batcher.batch(render);
        },
        unbind(node) {
            return this.data.remove(node);
        },
        bind(target, name, value, container, attr) {
            var _a;
            const self = this;
            value = value.replace(this.syntaxReplace, '').trim();
            name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();
            if (name.startsWith('on'))
                name = 'on-' + name.slice(2);
            if (value.startsWith('\'') || value.startsWith('"')) {
                target.textContent = value.slice(1, -1);
                return;
            }
            else if (/^NaN$|^[0-9]/.test(value)) {
                target.textContent = value;
                return;
            }
            else if (!/[._$a-z0-9[\]]+/.test(value)) {
                console.error('Oxe.binder - value is not valid');
            }
            const pipe = value.split(PIPE);
            const paths = value.match(VARIABLE_PATTERNS) || [];
            const names = name.split('-');
            const values = pipe[0] ? pipe[0].split('.') : [];
            const pipes = pipe[1] ? pipe[1].split(PIPES) : [];
            const meta = {};
            const type = names[0];
            const path = paths[0];
            const keys = ((_a = paths[0]) === null || _a === void 0 ? void 0 : _a.split('.')) || [];
            const property = keys.slice(-1)[0];
            const binder = Object.freeze({
                type,
                keys,
                name, value,
                names, pipes, values, meta,
                target, container,
                render: self.render,
                get path() {
                    return path;
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
                    const source = Traverse(container.model, keys, 1);
                    return source[property];
                },
                set data(value) {
                    const source = Traverse(container.model, keys, 1);
                    source[property] = value;
                }
            });
            this.data.set(attr || binder.target, binder);
            if (target.nodeName.includes('-')) {
                window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            }
            else {
                this.render(binder);
            }
        },
        remove(node) {
            const attributes = node.attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                this.unbind(attribute);
            }
            this.unbind(node);
            node = node.firstChild;
            while (node) {
                this.remove(node);
                node = node.nextSibling;
            }
        },
        add(node, container) {
            const type = node.nodeType;
            if (type === Node.TEXT_NODE) {
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
                    this.bind(node, 'text', node.textContent, container);
                    this.add(split);
                }
                else {
                    this.bind(node, 'text', node.textContent, container);
                }
            }
            else if (type === Node.ELEMENT_NODE) {
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
                node = node.firstChild;
                while (node) {
                    this.add(node, container);
                    node = node.nextSibling;
                }
            }
        }
    };
    var Binder$1 = Object.freeze(Object.assign(Object.assign({}, Binder), properties));

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

    var _css, _binder, _root, _name, _adopt, _shadow, _model, _adopted, _created, _attached, _detached, _attributed;
    const compose = function (instance, template) {
        const templateSlots = template.querySelectorAll('slot[name]');
        const defaultSlot = template.querySelector('slot:not([name])');
        for (let i = 0; i < templateSlots.length; i++) {
            const templateSlot = templateSlots[i];
            const name = templateSlot.getAttribute('name');
            const instanceSlot = instance.querySelector('[slot="' + name + '"]');
            if (instanceSlot) {
                templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
            }
            else {
                templateSlot.parentNode.removeChild(templateSlot);
            }
        }
        if (instance.children.length) {
            while (instance.firstChild) {
                if (defaultSlot) {
                    defaultSlot.parentNode.insertBefore(instance.firstChild, defaultSlot);
                }
                else {
                    instance.removeChild(instance.firstChild);
                }
            }
        }
        if (defaultSlot) {
            defaultSlot.parentNode.removeChild(defaultSlot);
        }
    };
    class Component extends HTMLElement {
        constructor() {
            super();
            _css.set(this, Css);
            _binder.set(this, Binder$1);
            _root.set(this, void 0);
            _name.set(this, void 0);
            _adopt.set(this, void 0);
            _shadow.set(this, void 0);
            _model.set(this, void 0);
            _adopted.set(this, void 0);
            _created.set(this, void 0);
            _attached.set(this, void 0);
            _detached.set(this, void 0);
            _attributed.set(this, void 0);
            __classPrivateFieldSet(this, _adopt, typeof this.constructor.adopt === 'boolean' ? this.constructor.adopt : false);
            __classPrivateFieldSet(this, _shadow, typeof this.constructor.shadow === 'boolean' ? this.constructor.shadow : false);
            __classPrivateFieldSet(this, _adopted, typeof this.constructor.adopted === 'function' ? this.constructor.adopted : function () { });
            __classPrivateFieldSet(this, _created, typeof this.constructor.created === 'function' ? this.constructor.created : function () { });
            __classPrivateFieldSet(this, _attached, typeof this.constructor.attached === 'function' ? this.constructor.attached : function () { });
            __classPrivateFieldSet(this, _detached, typeof this.constructor.detached === 'function' ? this.constructor.detached : function () { });
            __classPrivateFieldSet(this, _attributed, typeof this.constructor.attributed === 'function' ? this.constructor.attributed : function () { });
            __classPrivateFieldSet(this, _name, this.nodeName.toLowerCase());
            __classPrivateFieldSet(this, _model, Observer.clone(this.constructor.model, (data, path) => {
                Binder$1.data.forEach(binder => {
                    if (binder.container === this && binder.path.includes(path)) {
                        Binder$1.render(binder);
                    }
                });
            }));
        }
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        get css() { return __classPrivateFieldGet(this, _css); }
        get model() { return __classPrivateFieldGet(this, _model); }
        get binder() { return __classPrivateFieldGet(this, _binder); }
        render() {
            const template = document.createElement('template');
            template.innerHTML = this.constructor.template;
            const clone = template.content.cloneNode(true);
            if (__classPrivateFieldGet(this, _adopt) === true) {
                let child = this.firstElementChild;
                while (child) {
                    Binder$1.add(child, this);
                    child = child.nextElementSibling;
                }
            }
            if (__classPrivateFieldGet(this, _shadow) && 'attachShadow' in document.body) {
                __classPrivateFieldSet(this, _root, this.attachShadow({ mode: 'open' }));
            }
            else if (__classPrivateFieldGet(this, _shadow) && 'createShadowRoot' in document.body) {
                __classPrivateFieldSet(this, _root, this.createShadowRoot());
            }
            else {
                compose(this, clone);
                __classPrivateFieldSet(this, _root, this);
            }
            let child = clone.firstElementChild;
            while (child) {
                Binder$1.add(child, this);
                __classPrivateFieldGet(this, _root).appendChild(child);
                child = clone.firstElementChild;
            }
        }
        attributeChangedCallback(name, oldValue, newValue) {
            Promise.resolve().then(() => __classPrivateFieldGet(this, _attributed).call(this, name, oldValue, newValue));
        }
        adoptedCallback() {
            Promise.resolve().then(() => __classPrivateFieldGet(this, _adopted).call(this));
        }
        disconnectedCallback() {
            __classPrivateFieldGet(this, _css).detach(__classPrivateFieldGet(this, _name));
            Promise.resolve().then(() => __classPrivateFieldGet(this, _detached).call(this));
        }
        connectedCallback() {
            __classPrivateFieldGet(this, _css).attach(__classPrivateFieldGet(this, _name), this.constructor.css);
            if (this.CREATED) {
                Promise.resolve().then(() => __classPrivateFieldGet(this, _attached).call(this));
            }
            else {
                this.CREATED = true;
                this.render();
                Promise.resolve().then(() => __classPrivateFieldGet(this, _created).call(this)).then(() => __classPrivateFieldGet(this, _attached).call(this));
            }
        }
    }
    _css = new WeakMap(), _binder = new WeakMap(), _root = new WeakMap(), _name = new WeakMap(), _adopt = new WeakMap(), _shadow = new WeakMap(), _model = new WeakMap(), _adopted = new WeakMap(), _created = new WeakMap(), _attached = new WeakMap(), _detached = new WeakMap(), _attributed = new WeakMap();
    Component.model = {};
    Component.template = '';
    Component.attributes = [];

    function Location(data) {
        data = data || window.location.href;
        const parser = document.createElement('a');
        parser.href = data;
        const location = {
            path: '',
            href: parser.href,
            host: parser.host,
            port: parser.port,
            hash: parser.hash,
            search: parser.search,
            protocol: parser.protocol,
            hostname: parser.hostname,
            pathname: parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname
        };
        location.path = location.pathname + location.search + location.hash;
        return location;
    }

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

    const single = '/';
    const double = '//';
    const colon = '://';
    const ftp = 'ftp://';
    const file = 'file://';
    const http = 'http://';
    const https = 'https://';
    function absolute(path) {
        if (path.slice(0, single.length) === single ||
            path.slice(0, double.length) === double ||
            path.slice(0, colon.length) === colon ||
            path.slice(0, ftp.length) === ftp ||
            path.slice(0, file.length) === file ||
            path.slice(0, http.length) === http ||
            path.slice(0, https.length) === https) {
            return true;
        }
        else {
            return false;
        }
    }

    function resolve(...paths) {
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
    }

    function fetch(url) {
        return new globalThis.Promise((resolve, reject) => {
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
    }

    function run(code) {
        return new globalThis.Promise(function (resolve, reject) {
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
    }

    var S_EXPORT = `

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

    var S_IMPORT = `

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
            if (absolute(pathImport)) {
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
            console.log('not native import');
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

    function Define(name, constructor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name)
                throw new Error('Oxe.define - name required');
            if (!name)
                throw new Error('Oxe.define - constructor required');
            if (typeof constructor === 'string') {
                return Promise.resolve()
                    .then(() => load(constructor))
                    .then(data => Define(name, data.default));
            }
            else if (constructor instanceof Array) {
                constructor.forEach(Define.bind(this, name));
            }
            else {
                window.customElements.define(name, constructor);
            }
        });
    }

    function Events(target, name, detail, options) {
        options = options || { detail: null };
        options.detail = detail === undefined ? null : detail;
        target.dispatchEvent(new window.CustomEvent(name, options));
    }

    function Query(data) {
        data = data || window.location.search;
        if (typeof data === 'string') {
            const result = {};
            if (data.indexOf('?') === 0)
                data = data.slice(1);
            const queries = data.split('&');
            for (let i = 0; i < queries.length; i++) {
                const [name, value] = queries[i].split('=');
                if (name !== undefined && value !== undefined) {
                    if (name in result) {
                        if (typeof result[name] === 'string') {
                            result[name] = [value];
                        }
                        else {
                            result[name].push(value);
                        }
                    }
                    else {
                        result[name] = value;
                    }
                }
            }
            return result;
        }
        else {
            const result = [];
            for (const key in data) {
                const value = data[key];
                result.push(`${key}=${value}`);
            }
            return `?${result.join('&')}`;
        }
    }

    var _folder, _target, _contain, _external, _after, _before, _mode, _a$1;
    const absolute$1 = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Router = new (_a$1 = class Router {
            constructor() {
                this.data = [];
                _folder.set(this, void 0);
                _target.set(this, void 0);
                _contain.set(this, void 0);
                _external.set(this, void 0);
                _after.set(this, void 0);
                _before.set(this, void 0);
                _mode.set(this, 'push');
            }
            setup(option = {}) {
                var _a, _b, _c;
                return __awaiter(this, void 0, void 0, function* () {
                    __classPrivateFieldSet(this, _after, option.after);
                    __classPrivateFieldSet(this, _before, option.before);
                    __classPrivateFieldSet(this, _external, option.external);
                    __classPrivateFieldSet(this, _mode, (_a = option.mode) !== null && _a !== void 0 ? _a : 'push');
                    __classPrivateFieldSet(this, _contain, (_b = option.contain) !== null && _b !== void 0 ? _b : false);
                    __classPrivateFieldSet(this, _folder, (_c = option.folder) !== null && _c !== void 0 ? _c : './routes');
                    __classPrivateFieldSet(this, _target, option.target instanceof Element ? option.target : document.body.querySelector(option.target || 'main'));
                    if (__classPrivateFieldGet(this, _mode) !== 'href') {
                        console.log(__classPrivateFieldGet(this, _mode));
                        window.addEventListener('popstate', this.state.bind(this), true);
                        window.document.addEventListener('click', this.click.bind(this), true);
                    }
                    yield this.add(option.routes);
                    yield this.route(window.location.href, { mode: 'replace' });
                });
            }
            ;
            compare(routePath, userPath) {
                const userParts = absolute$1(userPath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');
                const routeParts = absolute$1(routePath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');
                for (let i = 0, l = userParts.length; i < l; i++) {
                    if (routeParts[i] === 'any')
                        return true;
                    if (routeParts[i] !== userParts[i])
                        return false;
                }
                return true;
            }
            ;
            scroll(x, y) {
                window.scroll(x, y);
            }
            ;
            back() {
                return __awaiter(this, void 0, void 0, function* () {
                    window.history.back();
                });
            }
            ;
            forward() {
                return __awaiter(this, void 0, void 0, function* () {
                    window.history.forward();
                });
            }
            ;
            redirect(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    window.location.href = path;
                });
            }
            ;
            add(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (typeof data === 'string') {
                        let load = data;
                        let path = data;
                        if (path.slice(-3) === '')
                            path = path.slice(0, -3);
                        if (path.slice(-5) === 'index')
                            path = path.slice(0, -5);
                        if (path.slice(-6) === 'index/')
                            path = path.slice(0, -6);
                        if (path.slice(0, 2) === './')
                            path = path.slice(2);
                        if (path.slice(0, 1) !== '/')
                            path = '/' + path;
                        if (load.slice(-3) !== '')
                            load = load + '';
                        if (load.slice(0, 2) === './')
                            load = load.slice(2);
                        if (load.slice(0, 1) !== '/')
                            load = '/' + load;
                        if (load.slice(0, 1) === '/')
                            load = load.slice(1);
                        if (__classPrivateFieldGet(this, _folder).slice(-1) === '/')
                            __classPrivateFieldSet(this, _folder, __classPrivateFieldGet(this, _folder).slice(0, -1));
                        load = __classPrivateFieldGet(this, _folder) + '/' + load + '.js';
                        load = absolute$1(load);
                        const name = `r-${data.replace('/', '-')}`;
                        this.add({ path, name, load });
                    }
                    else if (data instanceof Array) {
                        return Promise.all(data.map(route => this.add(route)));
                    }
                    else {
                        this.data.push(data);
                    }
                });
            }
            ;
            remove(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < this.data.length; i++) {
                        if (this.data[i].path === path) {
                            this.data.splice(i, 1);
                        }
                    }
                });
            }
            ;
            get(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < this.data.length; i++) {
                        if (this.data[i].path === path) {
                            this.data[i] = yield this.load(this.data[i]);
                            return this.data[i];
                        }
                    }
                });
            }
            ;
            filter(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    const result = [];
                    for (let i = 0; i < this.data.length; i++) {
                        if (this.compare(this.data[i].path, path)) {
                            this.data[i] = yield this.load(this.data[i]);
                            result.push(this.data[i]);
                        }
                    }
                    return result;
                });
            }
            ;
            load(route) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!route.component) {
                        const load$1 = yield load(route.load);
                        route.component = load$1.default;
                    }
                    return route;
                });
            }
            ;
            find(path) {
                return __awaiter(this, void 0, void 0, function* () {
                    const route = this.data.find(route => this.compare(route.path, path));
                    return route ? yield this.load(route) : null;
                });
            }
            ;
            render(route) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!route.target) {
                        if (!route.name)
                            throw new Error('Oxe.router.render - name required');
                        if (!route.component)
                            throw new Error('Oxe.router.render - component required');
                        window.customElements.define(route.name, route.component);
                        route.target = window.document.createElement(route.name);
                    }
                    window.document.title = route.component.title || route.target.title;
                    if (!__classPrivateFieldGet(this, _target)) {
                        throw new Error(`Oxe.router.render - target required`);
                    }
                    while (__classPrivateFieldGet(this, _target).firstChild) {
                        __classPrivateFieldGet(this, _target).removeChild(__classPrivateFieldGet(this, _target).firstChild);
                    }
                    __classPrivateFieldGet(this, _target).appendChild(route.target);
                    window.scroll(0, 0);
                });
            }
            ;
            route(path, options = {}) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (options.query) {
                        path += Query(options.query);
                    }
                    const location = Location(path);
                    const mode = options.mode || __classPrivateFieldGet(this, _mode);
                    const route = yield this.find(location.pathname);
                    if (!route) {
                        throw new Error(`Oxe.router.route - ${location.pathname} not found`);
                    }
                    if (mode === 'href') {
                        return window.location.assign(location.path);
                    }
                    if (typeof __classPrivateFieldGet(this, _before) === 'function') {
                        yield __classPrivateFieldGet(this, _before).call(this, location);
                    }
                    Events(__classPrivateFieldGet(this, _target), 'before', location);
                    window.history[mode + 'State']({ path: location.path }, '', location.path);
                    yield this.render(route);
                    if (typeof __classPrivateFieldGet(this, _after) === 'function') {
                        yield __classPrivateFieldGet(this, _after).call(this, location);
                    }
                    Events(__classPrivateFieldGet(this, _target), 'after', location);
                });
            }
            ;
            state(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    const path = event && event.state ? event.state.path : window.location.href;
                    this.route(path, { mode: 'replace' });
                });
            }
            ;
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
                    this.route(target.href);
                });
            }
            ;
        },
        _folder = new WeakMap(),
        _target = new WeakMap(),
        _contain = new WeakMap(),
        _external = new WeakMap(),
        _after = new WeakMap(),
        _before = new WeakMap(),
        _mode = new WeakMap(),
        _a$1);

    const assignOwnPropertyDescriptors = function (target, source) {
        for (const name in source) {
            if (Object.prototype.hasOwnProperty.call(source, name)) {
                const descriptor = Object.getOwnPropertyDescriptor(source, name);
                Object.defineProperty(target, name, descriptor);
            }
        }
        return target;
    };
    function Class$1 (parent, child) {
        child = child || parent;
        parent = parent === child ? undefined : parent;
        const prototype = typeof child === 'function' ? child.prototype : child;
        const constructor = typeof child === 'function' ? child : child.constructor;
        const Class = function Class() {
            const self = this;
            constructor.apply(self, arguments);
            if ('super' in self) {
                if ('_super' in self) {
                    return assignOwnPropertyDescriptors(self._super, self);
                }
                else {
                    throw new Error('Class this.super call required');
                }
            }
            else {
                return self;
            }
        };
        if (parent) {
            assignOwnPropertyDescriptors(Class, parent);
            Class.prototype = Object.create(parent.prototype);
            assignOwnPropertyDescriptors(Class.prototype, prototype);
            const Super = function Super() {
                if (this._super)
                    return this._super;
                this._super = window.Reflect.construct(parent, arguments, this.constructor);
                assignOwnPropertyDescriptors(this.super, parent.prototype);
                return this._super;
            };
            Object.defineProperty(Class.prototype, 'super', { enumerable: false, writable: true, value: Super });
        }
        else {
            Class.prototype = Object.create({});
            assignOwnPropertyDescriptors(Class.prototype, prototype);
        }
        Object.defineProperty(Class.prototype, 'constructor', { enumerable: false, writable: true, value: Class });
        return Class;
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
    const setup$1 = document.querySelector('script[o-setup]');
    const url = setup$1 ? setup$1.getAttribute('o-setup') : '';
    if (setup$1)
        load(url);
    let SETUP = false;
    var index = Object.freeze(new class Oxe {
        constructor() {
            this.Component = Component;
            this.component = Component;
            this.Location = Location;
            this.location = Location;
            this.Batcher = Batcher;
            this.batcher = Batcher;
            this.Fetcher = Fetcher;
            this.fetcher = Fetcher;
            this.Router = Router;
            this.router = Router;
            this.Binder = Binder$1;
            this.binder = Binder$1;
            this.Define = Define;
            this.define = Define;
            this.Class = Class$1;
            this.class = Class$1;
            this.Query = Query;
            this.query = Query;
            this.Load = load;
            this.load = load;
            this.Css = Css;
            this.css = Css;
        }
        setup(options) {
            if (SETUP)
                return;
            else
                SETUP = true;
            return Promise.all([
                this.binder.setup(options.binder),
                this.fetcher.setup(options.fetcher),
                options.router ? this.router.setup(options.router) : null
            ]);
        }
    });

    return index;

})));
