
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

    const isMap = (data) => data?.constructor === Map;
    const isDate = (data) => data?.constructor === Date;
    const isArray = (data) => data?.constructor === Array;
    const isString = (data) => data?.constructor === String;
    const isNumber = (data) => data?.constructor === Number;
    const isObject = (data) => data?.constructor === Object;
    const isBoolean = (data) => data?.constructor === Boolean;
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
        catch {
            return target;
        }
    };
    const toDash = (data) => data.replace(/[a-zA-Z][A-Z]/g, c => `${c[0]}-${c[1]}`.toLowerCase());
    const traverse$1 = function (data, paths) {
        paths = typeof paths === 'string' ? paths.split(/\.|\[|(\]\.?)/) : paths;
        if (!paths.length) {
            return data;
        }
        else if (typeof data !== 'object') {
            return undefined;
        }
        else {
            return traverse$1(data[paths[0]], paths.slice(1));
        }
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
    const schedule = async function () {
        if (this.options.pending)
            return;
        else
            this.options.pending = true;
        return this.tick(this.flush);
    };
    const flush = async function (time) {
        const readTasks = [];
        let read;
        let reads = 0;
        while (read = this.reads.shift()) {
            if (read)
                readTasks.push(read());
            reads++;
        }
        await Promise.all(readTasks);
        const writeTasks = [];
        let write;
        let writes = 0;
        while (write = this.writes.shift()) {
            if (write)
                writeTasks.push(write());
            if (++writes === reads)
                break;
        }
        await Promise.all(writeTasks);
        if (this.reads.length === 0 && this.writes.length === 0) {
            this.options.pending = false;
        }
        else {
            return this.tick(this.flush);
        }
    };
    const remove = function (tasks, task) {
        const index = tasks.indexOf(task);
        return !!~index && !!tasks.splice(index, 1);
    };
    const clear = function (task) {
        return this.remove(this.reads, task) || this.remove(this.writes, task);
    };
    const batch = function (read, write) {
        if (!read && !write)
            return;
        this.reads.push(read);
        this.writes.push(write);
        this.schedule().catch(console.error);
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
        let data, checked;
        return {
            async read() {
                data = await binder.compute();
                if (!binder.meta.setup) {
                    binder.meta.setup = true;
                    binder.target.addEventListener('input', event => binder.render(event));
                }
                if (isBoolean(data)) {
                    checked = event ? binder.target.checked : data;
                }
                if (event) {
                    if (isBoolean(data)) {
                        binder.data = checked;
                    }
                }
            },
            async write() {
                binder.target.checked = checked;
                if (checked) {
                    binder.target.setAttribute('checked', '');
                }
                else {
                    binder.target.removeAttribute('checked');
                }
            }
        };
    }

    const booleans = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];
    function Default (binder) {
        let data, result, boolean;
        return {
            async read() {
                data = await binder.compute();
                boolean = booleans.includes(binder.name);
                if (boolean) {
                    data = data ? true : false;
                }
                else {
                    data = toString(data);
                }
            },
            async write() {
                binder.target[binder.name] = result;
                if (boolean) {
                    if (data)
                        binder.target.setAttribute(binder.name, '');
                    else
                        binder.target.removeAttribute(binder.name);
                }
                else {
                    binder.target.setAttribute(binder.name, data);
                }
            }
        };
    }

    function each (binder) {
        let data;
        return {
            async read() {
                data = binder.data;
                if (!binder.meta.setup) {
                    const [key, index, variable] = binder.value.slice(2, -2).replace(/\s+of\s+.*/, '').split(/\s*,\s*/);
                    binder.meta.variable = variable;
                    binder.meta.index = index;
                    binder.meta.key = key;
                    binder.meta.keys = [];
                    binder.meta.counts = [];
                    binder.meta.setup = true;
                    binder.meta.targetLength = 0;
                    binder.meta.currentLength = 0;
                    binder.meta.templateLength = 0;
                    binder.meta.templateString = '';
                    let node;
                    while (node = binder.target.firstChild) {
                        if (node.nodeType === 1 || (node.nodeType === 3 && /\S/.test(node.nodeValue))) {
                            binder.meta.templateString += node.outerHTML;
                            binder.meta.templateLength++;
                        }
                        binder.target.removeChild(node);
                    }
                }
                if (data instanceof Array) {
                    binder.meta.targetLength = data.length;
                }
                else {
                    binder.meta.keys = Object.keys(data || {});
                    binder.meta.targetLength = binder.meta.keys.length;
                }
            },
            async write() {
                if (binder.meta.currentLength > binder.meta.targetLength) {
                    while (binder.meta.currentLength > binder.meta.targetLength) {
                        let count = binder.meta.templateLength;
                        while (count--) {
                            const node = binder.target.lastChild;
                            binder.target.removeChild(node);
                            Binder.remove(node);
                        }
                        binder.meta.currentLength--;
                    }
                }
                else if (binder.meta.currentLength < binder.meta.targetLength) {
                    while (binder.meta.currentLength < binder.meta.targetLength) {
                        const index = binder.meta.currentLength;
                        const key = binder.meta.keys[index] ?? index;
                        const variable = `${binder.path}.${key}`;
                        let clone = binder.meta.templateString;
                        const rKey = new RegExp(`\\b(${binder.meta.key})\\b`, 'g');
                        const rIndex = new RegExp(`\\b(${binder.meta.index})\\b`, 'g');
                        const rVariable = new RegExp(`\\b(${binder.meta.variable})\\b`, 'g');
                        const syntax = new RegExp(`{{.*?\\b(${binder.meta.variable}|${binder.meta.index}|${binder.meta.key})\\b.*?}}`, 'g');
                        clone.match(syntax)?.forEach(match => clone = clone.replace(match, match.replace(rVariable, variable).replace(rIndex, index).replace(rKey, key)));
                        const template = document.createElement('template');
                        template.innerHTML = clone;
                        for (const node of template.content.childNodes) {
                            Binder.add(node, binder.container);
                            binder.target.appendChild(node);
                        }
                        binder.meta.currentLength++;
                    }
                }
            }
        };
    }

    function html (binder) {
        let data;
        return {
            read() {
                data = binder.data;
                if (data === undefined || data === null) {
                    data = '';
                }
                else {
                    data = toString(data);
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

    const submit = async function (event, binder) {
        event.preventDefault();
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
            (b ? b.data : (element.files ? (element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0]) : element.value));
            const name = element.name || (b ? b.values[b.values.length - 1] : null);
            if (!name)
                continue;
        }
        await binder.compute(binder.container, event);
        if (binder.getAttribute('reset')) {
            event.target.reset();
        }
        return false;
    };
    const reset = async function (binder, event) {
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
            const binder = Binder.get(element)?.get('value');
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
        return binder.compute(binder.container, event);
    };
    function on (binder) {
        const read = async function () {
            binder.target[binder.name] = null;
            const name = binder.name.slice(2);
            if (binder.meta.method) {
                binder.target.removeEventListener(name, binder.meta.method);
            }
            binder.meta.method = event => {
                if (name === 'reset') {
                    return reset.call(binder.container, event, binder);
                }
                else if (name === 'submit') {
                    return submit.call(binder.container, event, binder);
                }
                else {
                    return binder.compute(binder.container, event);
                }
            };
            binder.target.addEventListener(name, binder.meta.method);
        };
        return { read };
    }

    function text (binder) {
        let data;
        return {
            async read() {
                data = await binder.compute();
                data = toString(data);
            },
            async write() {
                if (data === binder.target.textContent)
                    return;
                binder.target.textContent = data;
            }
        };
    }

    const input = function (binder) {
        const type = binder.target.type;
        console.log('event', type);
        let data;
        if (type === 'select-one') {
            data = binder.data = binder.target.value;
        }
        else if (type === 'select-multiple') {
            data = binder.data = [...binder.target.selectedOptions].map(o => o.value);
            console.log(binder);
            data = data.join(',');
        }
        else if (type === 'checkbox' || type === 'radio') {
            data = binder.data = to(binder.data, binder.target.value);
        }
        else if (type === 'number') {
            data = binder.data = toNumber(binder.target.value);
        }
        else if (type === 'file') {
            const multiple = binder.target.multiple;
            data = binder.data = multiple ? [...binder.target.files] : binder.target.files[0];
            data = multiple ? data.join(',') : data;
        }
        else {
            data = binder.data = binder.target.value;
        }
        binder.target.setAttribute('value', data);
    };
    function value (binder) {
        console.log('not event');
        const type = binder.target.type;
        if (!binder.meta.listener) {
            binder.meta.listener = true;
            binder.target.addEventListener('input', () => input(binder));
        }
        if (type === 'select-one') {
            return {
                async read(ctx) {
                    ctx.data = await binder.compute();
                    ctx.value = binder.target.value;
                },
                async write(ctx) {
                    let value;
                    if ('' === ctx.data || null === ctx.data || undefined === ctx.data) {
                        value = binder.data = ctx.value;
                    }
                    else {
                        value = binder.target.value = ctx.data;
                    }
                    binder.target.setAttribute('value', value);
                }
            };
        }
        else if (type === 'select-multiple') {
            return {
                async read(ctx) {
                    ctx.data = await binder.compute();
                    ctx.options = [...binder.target.options];
                    ctx.value = [...binder.target.selectedOptions].map(o => o.value);
                },
                async write(ctx) {
                    let value;
                    if (!(ctx.data?.constructor instanceof Array) || !ctx.data.length) {
                        value = binder.data = ctx.value;
                    }
                    else {
                        value = '';
                        ctx.options.forEach((o, i) => {
                            o.selected = o.value == ctx.data[i];
                            value += `${o.value},`;
                        });
                    }
                    binder.target.setAttribute('value', value);
                }
            };
        }
        else if (type === 'checkbox' || type === 'radio') {
            let data;
            return {
                async read() {
                    data = await binder.data;
                },
                async write() {
                    binder.target.value = data;
                    binder.target.setAttribute('value', data);
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
                    binder.target.value = ctx.data ?? '';
                }
            };
        }
    }

    const $string = 'string';
    const $number = 'number';
    const $variable = 'variable';
    const $function = 'function';
    const traverse = function (data, paths) {
        paths = typeof paths === 'string' ? paths.split(/\.|\[|\]/) : paths;
        if (!paths.length) {
            return data;
        }
        else if (typeof data !== 'object') {
            return undefined;
        }
        else {
            return traverse(data[paths[0]], paths.slice(1));
        }
    };
    const finish = function (node, data, tree) {
        if (node.value === 'NaN') {
            node.type = 'nan';
            node.compute = () => NaN;
        }
        else if (node.value === 'null') {
            node.type = 'null';
            node.compute = () => null;
        }
        else if (node.value === 'true') {
            node.type = 'boolean';
            node.compute = () => true;
        }
        else if (node.value === 'false') {
            node.type = 'boolean';
            node.compute = () => false;
        }
        else if (node.value === 'undefined') {
            node.type = 'undefined';
            node.compute = () => undefined;
        }
        else if (node.type === $number) {
            node.compute = () => Number(node.value);
        }
        else if (node.type === $string) {
            node.compute = () => node.value;
        }
        else if (node.type === $function) {
            tree.paths.push(node.value);
            node.compute = (context, ...args) => traverse(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args));
        }
        else {
            node.type = $variable;
            tree.paths.push(node.value);
            node.compute = () => traverse(data, node.value);
        }
    };
    function expression(expression, data) {
        const tree = { type: 'tree', children: [], paths: [], value: null, parent: null, compute: null };
        let inside = false;
        let node = { value: '', parent: tree, children: [] };
        expression = expression.replace(/{{.*\s+(of|in)\s+/, '{{');
        for (let i = 0; i < expression.length; i++) {
            const c = expression[i];
            const next = expression[i + 1];
            const previous = expression[i - 1];
            if (inside === false &&
                c === '{' && next === '{') {
                i++;
                if (node.value) {
                    finish(node, data, tree);
                    node.parent.children.push(node);
                }
                inside = true;
                node = { value: '', parent: node.parent };
            }
            else if (inside === true &&
                c === '}' && next === '}') {
                i++;
                if (node.value) {
                    finish(node, data, tree);
                    node.parent.children.push(node);
                }
                inside = false;
                node = { value: '', parent: node.parent };
            }
            else if (inside === false) {
                node.value += c;
                node.type = $string;
            }
            else if (/'|`|"/.test(c) && !node.type || node.type === $string) {
                node.type = $string;
                node.value += c;
                if (node.value.length > 1 && node.value[0] === c && previous !== '\\') {
                    node.value = node.value.slice(1, -1);
                    finish(node, data, tree);
                    node.parent.children.push(node);
                    node = { value: '', parent: node.parent };
                }
            }
            else if (/[0-9.]/.test(c) && !node.type || node.type === $number) {
                node.type = $number;
                node.value += c;
                if (!/[0-9.]/.test(next)) {
                    finish(node, data, tree);
                    node.parent.children.push(node);
                    node = { value: '', parent: node.parent };
                }
            }
            else if (',' === c) {
                if (node.value) {
                    finish(node, data, tree);
                    node.parent.children.push(node);
                    node = { value: '', parent: node.parent };
                }
            }
            else if ('(' === c) {
                node.children = [];
                node.type = $function;
                finish(node, data, tree);
                node.parent.children.push(node);
                node = { value: '', parent: node };
            }
            else if (')' === c) {
                if (node.value) {
                    finish(node, data, tree);
                    node.parent.children.push(node);
                }
                node = { value: '', parent: node.parent.parent };
            }
            else if (/\s/.test(c)) {
                continue;
            }
            else if (/[a-zA-Z$_]/.test(c) && !node.type || node.type === $variable) {
                node.type = $variable;
                node.value += c;
            }
            else {
                node.value += c;
            }
        }
        if (node.type) {
            node.compute = function (value) { return value; }.bind(null, node.value);
            tree.children.push(node);
        }
        if (tree.children.length === 1) {
            tree.compute = (...args) => tree.children[0].compute(...args);
        }
        else {
            tree.compute = (...args) => tree.children.map(child => child.compute(...args)).join('');
        }
        return tree;
    }

    const isNative = /^NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9.]+?$/;
    const isSyntaxNative = /^\{\{NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9]+(\.[0-9]+)?\}\}$/;
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
                default: Default,
                each,
                html,
                on,
                text,
                value
            };
        }
        async setup(options = {}) {
            const { binders } = options;
            if (binders) {
                for (const name in binders) {
                    if (name in this.binders === false) {
                        this.binders[name] = binders[name].bind(this);
                    }
                }
            }
        }
        get(node) {
            return this.data.get(node);
        }
        async unbind(node) {
            return this.data.delete(node);
        }
        async bind(target, name, value, container, pointer) {
            const self = this;
            if (isSyntaxNative.test(value)) {
                target.textContent = value.replace(/\{\{\'?\`?\"?|\"?\`?\'?\}\}/g, '');
                return;
            }
            const { compute, paths } = expression(value, container.data);
            const type = name.startsWith('on') ? 'on' : name in self.binders ? name : 'default';
            const action = self.binders[type];
            const render = async function (...extra) {
                if (this.busy)
                    return;
                else
                    this.busy = true;
                const { read, write } = this.action(this, ...extra);
                const context = {};
                Batcher.batch(async () => {
                    if (read)
                        await read(context);
                }, async () => {
                    if (write)
                        await write(context);
                    this.busy = false;
                });
            };
            for (const path of paths) {
                if (isNative.test(path))
                    continue;
                const keys = path.split('.');
                const [key] = keys.slice(-1);
                const childKey = keys.slice(-1)[0];
                const parentKeys = keys.slice(0, -1);
                const binder = {
                    meta: {},
                    busy: false,
                    compute,
                    path,
                    key, keys,
                    name, value,
                    childKey, parentKeys,
                    type,
                    target,
                    container,
                    action,
                    render,
                    get data() {
                        const parentValue = traverse$1(this.container.data, this.parentKeys);
                        const childValue = parentValue?.[this.childKey];
                        if (typeof childValue === 'function') {
                            return event => {
                                const args = this.args.map(arg => this.parse(arg, this.container.data));
                                if (event)
                                    args.unshift(event);
                                return childValue.apply(this.container, args);
                            };
                        }
                        else {
                            return childValue;
                        }
                    },
                    set data(value) {
                        const parentValue = traverse$1(this.container.data, this.parentKeys);
                        const childValue = parentValue?.[this.childKey];
                        if (typeof childValue === 'function') {
                            parentValue[this.childKey] = event => {
                                const args = this.args.map(arg => this.parse(arg, this.container.data));
                                if (event)
                                    args.unshift(event);
                                return childValue.apply(this.container, args);
                            };
                        }
                        else {
                            parentValue[this.childKey] = value;
                        }
                    }
                };
                this.data.set(pointer, binder);
                binder.render();
            }
        }
        async remove(node) {
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
        async add(node, container) {
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
                    if (name.indexOf(this.prefix) === 0 ||
                        (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1) ||
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

    var _data$2, _style, _support, _a$1;
    var Css = new (_a$1 = class Css {
            constructor() {
                _data$2.set(this, new Map());
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
                const item = __classPrivateFieldGet(this, _data$2).get(name);
                if (!item || item.count === 0)
                    return;
                item.count--;
                if (item.count === 0 && __classPrivateFieldGet(this, _style).contains(item.node)) {
                    __classPrivateFieldGet(this, _style).removeChild(item.node);
                }
            }
            attach(name, text) {
                const item = __classPrivateFieldGet(this, _data$2).get(name) || { count: 0, node: this.node(name, text) };
                if (item) {
                    item.count++;
                }
                else {
                    __classPrivateFieldGet(this, _data$2).set(name, item);
                }
                if (!__classPrivateFieldGet(this, _style).contains(item.node)) {
                    __classPrivateFieldGet(this, _style).appendChild(item.node);
                }
            }
            node(name, text) {
                return document.createTextNode(this.scope(name, this.transform(text)));
            }
        },
        _data$2 = new WeakMap(),
        _style = new WeakMap(),
        _support = new WeakMap(),
        _a$1);

    var _root, _css, _html, _data$1, _adopt, _shadow, _flag, _name, _adopted, _rendered, _connected, _disconnected, _attributed;
    class Component extends HTMLElement {
        constructor() {
            super();
            _root.set(this, void 0);
            _css.set(this, void 0);
            _html.set(this, void 0);
            _data$1.set(this, void 0);
            _adopt.set(this, void 0);
            _shadow.set(this, void 0);
            _flag.set(this, false);
            _name.set(this, this.nodeName.toLowerCase());
            _adopted.set(this, typeof this.adopted === 'function' ? this.adopted : null);
            _rendered.set(this, typeof this.rendered === 'function' ? this.rendered : null);
            _connected.set(this, typeof this.connected === 'function' ? this.connected : null);
            _disconnected.set(this, typeof this.disconnected === 'function' ? this.disconnected : null);
            _attributed.set(this, typeof this.attributed === 'function' ? this.attributed : null);
            this.css = '';
            this.html = '';
            this.data = {};
            this.adopt = false;
            this.shadow = false;
            if (__classPrivateFieldGet(this, _shadow) && 'attachShadow' in document.body) {
                __classPrivateFieldSet(this, _root, this.attachShadow({ mode: 'open' }));
            }
            else if (__classPrivateFieldGet(this, _shadow) && 'createShadowRoot' in document.body) {
                __classPrivateFieldSet(this, _root, this.createShadowRoot());
            }
            else {
                __classPrivateFieldSet(this, _root, this);
            }
        }
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        get root() { return __classPrivateFieldGet(this, _root); }
        get binder() { return Binder; }
        async render() {
            __classPrivateFieldSet(this, _html, __classPrivateFieldGet(this, _html) ?? this.html);
            __classPrivateFieldSet(this, _data$1, __classPrivateFieldGet(this, _data$1) ?? this.data);
            __classPrivateFieldSet(this, _adopt, __classPrivateFieldGet(this, _adopt) ?? this.adopt);
            __classPrivateFieldSet(this, _shadow, __classPrivateFieldGet(this, _shadow) ?? this.shadow);
            this.data = Observer.clone(__classPrivateFieldGet(this, _data$1), (_, path) => {
                Binder.data.forEach(binder => {
                    if (binder.container === this && binder.path.startsWith(path)) {
                        binder.render();
                    }
                });
            });
            if (__classPrivateFieldGet(this, _adopt) === true) {
                let child = this.firstElementChild;
                while (child) {
                    Binder.add(child, this);
                    child = child.nextElementSibling;
                }
            }
            const template = document.createElement('template');
            template.innerHTML = __classPrivateFieldGet(this, _html);
            const clone = template.content.cloneNode(true);
            if (!__classPrivateFieldGet(this, _shadow) ||
                !('attachShadow' in document.body) &&
                    !('createShadowRoot' in document.body)) {
                const templateSlots = clone.querySelectorAll('slot[name]');
                const defaultSlot = clone.querySelector('slot:not([name])');
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
            let child = clone.firstChild;
            while (child) {
                Binder.add(child, this);
                __classPrivateFieldGet(this, _root).appendChild(child);
                child = clone.firstChild;
            }
        }
        async attributeChangedCallback(name, from, to) {
            await __classPrivateFieldGet(this, _attributed).call(this, name, from, to);
        }
        async adoptedCallback() {
            if (__classPrivateFieldGet(this, _adopted))
                await __classPrivateFieldGet(this, _adopted).call(this);
        }
        async disconnectedCallback() {
            Css.detach(__classPrivateFieldGet(this, _name));
            if (__classPrivateFieldGet(this, _disconnected))
                await __classPrivateFieldGet(this, _disconnected).call(this);
        }
        async connectedCallback() {
            __classPrivateFieldSet(this, _css, __classPrivateFieldGet(this, _css) ?? this.css);
            Css.attach(__classPrivateFieldGet(this, _name), __classPrivateFieldGet(this, _css));
            if (__classPrivateFieldGet(this, _flag)) {
                if (__classPrivateFieldGet(this, _connected))
                    await __classPrivateFieldGet(this, _connected).call(this);
            }
            else {
                __classPrivateFieldSet(this, _flag, true);
                await this.render();
                if (__classPrivateFieldGet(this, _rendered))
                    await __classPrivateFieldGet(this, _rendered).call(this);
                if (__classPrivateFieldGet(this, _connected))
                    await __classPrivateFieldGet(this, _connected).call(this);
            }
        }
    }
    _root = new WeakMap(), _css = new WeakMap(), _html = new WeakMap(), _data$1 = new WeakMap(), _adopt = new WeakMap(), _shadow = new WeakMap(), _flag = new WeakMap(), _name = new WeakMap(), _adopted = new WeakMap(), _rendered = new WeakMap(), _connected = new WeakMap(), _disconnected = new WeakMap(), _attributed = new WeakMap();

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
            catch {
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
    const load = async function (url) {
        if (!url)
            throw new Error('Oxe.load - url required');
        url = resolve(url);
        if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
            await run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
            window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
        }
        if (window.DYNAMIC_SUPPORT === true) {
            console.log('native import');
            await run(`window.MODULES["${url}"] = import("${url}");`);
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
            code = await fetch(url);
            code = transform(code, url);
        }
        try {
            await run(code);
        }
        catch {
            throw new Error(`Oxe.load - failed to import: ${url}`);
        }
        return this.modules[url];
    };
    window.LOAD = window.LOAD || load;
    window.MODULES = window.MODULES || {};

    var _target, _data, _folder, _dynamic, _contain, _external, _after, _before, _a;
    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Location = new (_a = class Location {
            constructor() {
                _target.set(this, void 0);
                _data.set(this, {});
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
            async listen(option) {
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
            }
            async assign(data) {
                return this.go(data, { mode: 'push' });
            }
            async replace(data) {
                return this.go(data, { mode: 'replace' });
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
            async go(path, options = {}) {
                const { mode } = options;
                const location = this.location(path);
                if (__classPrivateFieldGet(this, _before))
                    await __classPrivateFieldGet(this, _before).call(this, location);
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
                if (location.pathname in __classPrivateFieldGet(this, _data)) {
                    element = __classPrivateFieldGet(this, _data)[location.pathname];
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
                    const component = (await load(load$1)).default;
                    const name = 'l' + path.replace(/\/+/g, '-');
                    window.customElements.define(name, component);
                    element = window.document.createElement(name);
                    __classPrivateFieldGet(this, _data)[location.pathname] = element;
                }
                if (element.title)
                    window.document.title = element.title;
                while (__classPrivateFieldGet(this, _target).firstChild) {
                    __classPrivateFieldGet(this, _target).removeChild(__classPrivateFieldGet(this, _target).firstChild);
                }
                __classPrivateFieldGet(this, _target).appendChild(element);
                if (__classPrivateFieldGet(this, _after))
                    await __classPrivateFieldGet(this, _after).call(this, location);
            }
            async state(event) {
                await this.replace(event.state.href);
                window.scroll(event.state.top, 0);
            }
            async click(event) {
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
            }
        },
        _target = new WeakMap(),
        _data = new WeakMap(),
        _folder = new WeakMap(),
        _dynamic = new WeakMap(),
        _contain = new WeakMap(),
        _external = new WeakMap(),
        _after = new WeakMap(),
        _before = new WeakMap(),
        _a);

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
        async setup(option = {}) {
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
        }
        async method(method, data) {
            data = typeof data === 'string' ? { url: data } : data;
            return this.fetch({ ...data, method });
        }
        async get() {
            return this.method('get', ...arguments);
        }
        async put() {
            return this.method('put', ...arguments);
        }
        async post() {
            return this.method('post', ...arguments);
        }
        async head() {
            return this.method('head', ...arguments);
        }
        async patch() {
            return this.method('patch', ...arguments);
        }
        async delete() {
            return this.method('delete', ...arguments);
        }
        async options() {
            return this.method('options', ...arguments);
        }
        async connect() {
            return this.method('connect', ...arguments);
        }
        async serialize(data) {
            let query = '';
            for (const name in data) {
                query = query.length > 0 ? query + '&' : query;
                query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
            }
            return query;
        }
        async fetch(data = {}) {
            const { option } = this;
            const context = { ...option, ...data };
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
                await option.request(context);
            if (context.aborted)
                return;
            if (context.body) {
                if (context.method === 'GET') {
                    context.url = context.url + '?' + await this.serialize(context.body);
                }
                else if (context.contentType === 'json') {
                    context.body = JSON.stringify(context.body);
                }
            }
            const result = await window.fetch(context.url, context);
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
                context.body = await result[type]();
            }
            if (typeof option.response === 'function')
                await option.response(context);
            if (context.aborted)
                return;
            return context;
        }
    };

    async function Define(component) {
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

    return index;

})));
