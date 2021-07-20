
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

    console.warn('oxe: need to handle delete property');
    const $path = Symbol('$path');
    const $task = Symbol('$task');
    const $tasks = Symbol('$tasks');
    const $proxy = Symbol('$proxy');
    const $setup = Symbol('$setup');
    // const tick = Promise.resolve();
    const run$1 = async function (tasks) {
        let task;
        while (task = tasks.shift()) {
            await task();
        }
    };
    const set = function (target, key, value, receiver) {
        if (key === $path)
            return true;
        if (key === $task)
            return true;
        if (key === $tasks)
            return true;
        if (key === $proxy)
            return true;
        if (key === $setup)
            return true;
        if (key === 'length')
            return target[$tasks].push(target[$task].bind(null, target[$path]));
        const current = target[key];
        if (current !== current && value !== value)
            return true; // NaN check
        if (current === value && target[$setup])
            return true;
        // if (current === value) return true;
        const path = target[$path] ? `${target[$path]}.${key}` : `${key}`;
        const initial = !target[$tasks].length;
        target[$tasks].push(target[$task].bind(null, path));
        if (value && typeof value === 'object' && !value[$proxy]) {
            // const clone = value.constructor();
            // clone[ $path ] = path;
            // clone[ $proxy ] = true;
            // clone[ $task ] = target[ $task ];
            // clone[ $tasks ] = target[ $tasks ];
            // const proxy = new Proxy(clone, handler);
            // Object.assign(proxy, value);
            // target[ key ] = proxy;
            value[$path] = path;
            value[$proxy] = true;
            value[$setup] = false;
            value[$task] = target[$task];
            value[$tasks] = target[$tasks];
            const proxy = new Proxy(value, handler$1);
            Object.assign(proxy, value);
            value[$setup] = true;
            target[key] = proxy;
        }
        else {
            target[key] = value;
        }
        if (initial)
            run$1(target[$tasks]);
        return true;
    };
    const handler$1 = { set };
    const observer = function (source, task) {
        source[$path] = '';
        source[$tasks] = [];
        source[$task] = task;
        source[$proxy] = true;
        source[$setup] = false;
        const proxy = new Proxy(source, handler$1);
        Object.assign(proxy, source);
        source[$setup] = true;
        return proxy;
    };

    var booleanTypes = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];

    const format = (data) => data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;

    const standard = async function (binder) {
        const { name, owner, node } = binder;
        let data = await binder.compute();
        const boolean = booleanTypes.includes(name);
        if (boolean) {
            data = data ? true : false;
            if (data)
                owner.setAttributeNode(node);
            else
                owner.removeAttribute(name);
        }
        else {
            data = format(data);
            owner[name] = data;
            owner.setAttribute(name, data);
        }
    };

    const handler = async function (binder, checked, event) {
        // binder.busy = true;
        const { owner, node } = binder;
        const { value } = owner;
        const computed = await binder.compute({ event, checked, value });
        owner.checked = computed;
        if (owner.checked) {
            owner.setAttributeNode(node);
        }
        else {
            owner.removeAttribute('checked');
        }
        // binder.busy = false;
    };
    const checked = async function (binder) {
        const { owner, meta } = binder;
        if (!meta.setup) {
            meta.setup = true;
            owner.removeAttribute('checked');
            owner.addEventListener('input', async (event) => {
                const checked = owner.checked;
                await handler(binder, checked, event);
            });
            if (owner.type === 'radio') {
                const parent = owner.form || owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${owner.name}"]`);
                owner.addEventListener('input', async () => {
                    for (const radio of radios) {
                        const radioBinders = binder.binder.get(radio.getAttributeNode('checked'));
                        if (radioBinders) {
                            for (const [, radioBinder] of radioBinders) {
                                // radioBinder.busy = true;
                                await radioBinder.compute({ checked: radio.checked, value: radio.value });
                                // radioBinder.busy = false;
                            }
                        }
                        else {
                            if (radio.checked) {
                                radio.setAttribute('checked', '');
                            }
                            else {
                                radio.removeAttribute('checked');
                            }
                        }
                    }
                });
            }
        }
        const checked = binder.assignee();
        await handler(binder, checked);
    };

    var numberTypes = ['date', 'datetime-local', 'month', 'time', 'week', 'number', 'range'];

    console.warn('need to handle default select-one value');
    const stampFromView = function (data) {
        const date = new Date(data);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()).getTime();
    };
    const stampToView = function (data) {
        const date = new Date(data);
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())).getTime();
    };
    const input = async function (binder, event) {
        const { owner } = binder;
        const { type } = owner;
        let display, computed;
        if (type === 'select-one') {
            const [option] = owner.selectedOptions;
            const value = !option ? undefined : option.$typeof && option.$typeof !== 'string' ? JSON.parse(option.value) : option.value;
            computed = await binder.compute({ event, value });
            display = format(computed);
        }
        else if (type === 'select-multiple') {
            const value = [];
            for (const option of owner.selectedOptions) {
                value.push(option.$typeof && option.$typeof !== 'string' ? JSON.parse(option.value) : option.value);
            }
            computed = await binder.compute({ event, value });
            display = format(computed);
            // } else if (type === 'file') {
            //     const { multiple, files } = owner;
            //     const value = multiple ? [ ...files ] : files[ 0 ];
            //     const computed = await binder.compute({ event, value });
            //     display = format(computed);
        }
        else if (type === 'number' || type === 'range') {
            computed = await binder.compute({ event, value: owner.valueAsNumber });
            owner.valueAsNumber = computed;
            display = owner.value;
        }
        else if (numberTypes.includes(type)) {
            const value = owner.$typeof === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
            computed = await binder.compute({ event, value });
            if (owner.$typeof === 'string')
                owner.value = computed;
            else
                owner.valueAsNumber = stampToView(computed);
            display = owner.value;
        }
        else {
            const { checked } = owner;
            const value = owner.$typeof && owner.$typeof !== 'string' ? JSON.parse(owner.value) : owner.value;
            computed = await binder.compute({ event, value, checked });
            display = format(computed);
            owner.value = display;
        }
        owner.$value = computed;
        owner.$typeof = typeof computed;
        owner.setAttribute('value', display);
    };
    const value = async function value(binder) {
        const { owner, meta } = binder;
        const { type } = owner;
        if (!meta.setup) {
            meta.setup = true;
            if (type === 'select-one' || type === 'select-multiple') {
                owner.addEventListener('$renderEach', () => binder.render());
                owner.addEventListener('$renderOption', () => binder.render());
            }
            owner.addEventListener('input', event => input(binder, event));
        }
        let display, computed;
        if (type === 'select-one') {
            const value = binder.assignee();
            for (const option of owner.options) {
                if (option.selected = '$value' in option ? option.$value === value : option.value === value) {
                    break;
                }
            }
            computed = await binder.compute({ value: value });
            display = format(computed);
            owner.value = display;
        }
        else if (type === 'select-multiple') {
            const value = binder.assignee();
            const { options } = owner;
            for (const option of options) {
                option.selected = value?.includes('$value' in option ? option.$value : option.value);
            }
            computed = await binder.compute({ value });
            display = format(computed);
        }
        else if (type === 'number' || type === 'range') {
            const value = binder.assignee();
            computed = await binder.compute({ value });
            owner.valueAsNumber = computed;
            display = owner.value;
        }
        else if (numberTypes.includes(type)) {
            const value = binder.assignee();
            computed = await binder.compute({ value });
            if (typeof computed === 'string')
                owner.value = computed;
            else
                owner.valueAsNumber = stampToView(computed);
            display = owner.value;
        }
        else {
            const { checked } = owner;
            const value = binder.assignee();
            computed = await binder.compute({ value, checked });
            display = format(computed);
            owner.value = display;
        }
        owner.$value = computed;
        owner.$typeof = typeof computed;
        owner.setAttribute('value', display);
        console.log(owner, owner.$typeof);
        if (!meta.first) {
            meta.first = true;
            if (owner.parentElement.type === 'select-one' || owner.parentElement.type === 'select-multiple') {
                owner.parentElement.dispatchEvent(new Event('$renderOption'));
            }
        }
    };
    // const setup = async function (binder) {
    //     binder.owner.addEventListener('$render', () => binder.render());
    //     binder.owner.addEventListener('input', event => input(binder, event));
    // };
    // const read = async function (binder, context) {
    //     const { owner } = binder;
    //     context.options = owner.options;
    //     context.selected = owner.selectedOptions;
    // };
    // const write = async function (binder, context) {
    //     const { owner } = binder;
    //     const { type } = owner;
    //     let display, computed;
    //     if (type === 'select-one') {
    //         // if (!context.options.length) return;
    //         const value = binder.assignee();
    //         for (const option of context.options) {
    //             if (option.selected = option.value === value) break;
    //         }
    //         computed = await binder.compute({ value: value });
    //         display = format(computed);
    //         owner.value = display;
    //     } else if (type === 'select-multiple') {
    //         const value = binder.assignee();
    //         const { options } = owner;
    //         for (const option of options) {
    //             option.selected = value?.includes(option.value);
    //         }
    //         computed = await binder.compute({ value });
    //         display = format(computed);
    //     } else {
    //         const { checked } = owner;
    //         const value = binder.assignee();
    //         computed = await binder.compute({ value, checked });
    //         display = format(computed);
    //         if (numberTypes.includes(type) && typeof computed !== 'string') {
    //             owner.valueAsNumber = computed;
    //         } else {
    //             owner.value = display;
    //         }
    //     }
    //     owner.$value = computed;
    //     owner.$typeof = typeof computed;
    //     owner.setAttribute('value', display);
    // };
    // export default { setup, read, write };

    const tick$2 = Promise.resolve();
    const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;
    const setup = function (binder) {
        let [path, variable, index, key] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();
        binder.meta.keyPattern = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
        binder.meta.indexPattern = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
        binder.meta.variablePattern = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;
        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        binder.meta.pathParts = path.split('.');
        binder.meta.keys = [];
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.cloneLength = 0;
        binder.meta.clone = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');
        let node = binder.owner.firstChild;
        while (node) {
            binder.meta.clone.content.appendChild(node);
            binder.meta.cloneLength++;
            node = binder.owner.firstChild;
        }
    };
    const each = async function (binder) {
        if (!binder.meta.setup)
            await setup(binder);
        // const time = `each ${binder.meta.targetLength}`;
        // console.time(time);
        const data = await binder.compute();
        if (data instanceof Array) {
            binder.meta.targetLength = data.length;
        }
        else {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }
        if (binder.meta.currentLength > binder.meta.targetLength) {
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.cloneLength;
                while (count--) {
                    const node = binder.owner.lastChild;
                    binder.owner.removeChild(node);
                    tick$2.then(binder.binder.remove.bind(binder.binder, node));
                }
                binder.meta.currentLength--;
            }
        }
        else if (binder.meta.currentLength < binder.meta.targetLength) {
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const indexValue = binder.meta.currentLength;
                const keyValue = binder.meta.keys[indexValue] ?? indexValue;
                const variableValue = `${binder.meta.path}[${keyValue}]`;
                const dynamics = {
                    ...binder.dynamics,
                    get [binder.meta.keyName]() { return keyValue; },
                    get [binder.meta.indexName]() { return indexValue; },
                    set [binder.meta.variableName](value) {
                        let data = binder.container.data;
                        for (const part of binder.meta.pathParts) {
                            if (part in this)
                                data = this[part];
                            else if (part in data)
                                data = data[part];
                        }
                        data[keyValue] = value;
                    },
                    get [binder.meta.variableName]() {
                        let data = binder.container.data;
                        for (const part of binder.meta.pathParts) {
                            if (part in this)
                                data = this[part];
                            else if (part in data)
                                data = data[part];
                        }
                        return data[keyValue];
                    }
                };
                const rewrites = [...(binder.rewrites || [])];
                if (binder.meta.indexPattern)
                    rewrites.push([binder.meta.indexPattern, indexValue]);
                if (binder.meta.keyPattern)
                    rewrites.push([binder.meta.keyPattern, keyValue]);
                if (binder.meta.variablePattern)
                    rewrites.push([binder.meta.variablePattern, variableValue]);
                // const d = document.createElement('div');
                // d.className = 'box';
                // const t = document.createTextNode('{{item.number}}');
                // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
                // d.appendChild(t);
                // binder.meta.templateElement.content.appendChild(d)
                const clone = binder.meta.clone.content.cloneNode(true);
                let node = clone.firstChild;
                while (node) {
                    tick$2.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites));
                    // tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics));
                    // binder.binder.add(node, binder.container, dynamics);
                    node = node.nextSibling;
                }
                binder.meta.templateElement.content.appendChild(clone);
                binder.meta.currentLength++;
            }
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            // console.timeEnd(time);
            binder.owner.appendChild(binder.meta.templateElement.content);
            if (binder.owner.nodeName === 'SELECT')
                binder.owner.dispatchEvent(new Event('$renderEach'));
        }
    };

    const tick$1 = Promise.resolve();
    const html = async function (binder) {
        let data = await binder.compute();
        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }
        while (binder.owner.firstChild) {
            const node = binder.owner.removeChild(binder.owner.firstChild);
            binder.binder.remove(node);
        }
        const template = document.createElement('template');
        template.innerHTML = data;
        let node = template.content.firstChild;
        while (node) {
            tick$1.then(binder.binder.add.bind(binder.binder, node, binder.container));
            node = node.nextSibling;
        }
        binder.owner.appendChild(template.content);
    };

    const text = async function text(binder) {
        let data = await binder.compute();
        binder.owner.nodeValue = format(data);
    };

    const getValue = (element) => {
        if (!element)
            return undefined;
        else if ('$value' in element)
            return typeof element.$value === 'object' ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
        else if (numberTypes.includes(element.type))
            return element.valueAsNumber;
        else
            return element.value;
    };
    const submit = async function (event, binder) {
        event.preventDefault();
        const form = {};
        const target = event.target;
        const elements = target?.elements || target?.form?.elements;
        for (const element of elements) {
            const { type, name, nodeName, checked } = element;
            if (!name)
                continue;
            if ((!type && nodeName !== 'TEXTAREA') ||
                type === 'submit' || type === 'button' || !type)
                continue;
            if (type === 'radio' && !checked)
                continue;
            if (type === 'checkbox' && !checked)
                continue;
            let value;
            if ('$value' in element) {
                value = getValue(element);
            }
            else if (type === 'select-multiple') {
                value = [];
                for (const option of element.selectedOptions) {
                    value.push(getValue(option));
                }
            }
            else if (type === 'select-one') {
                const [option] = element.selectedOptions;
                value = getValue(option);
            }
            else {
                value = element.value;
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
        await binder.compute({ form, event });
        if (target.getAttribute('reset'))
            target.reset();
        return false;
    };
    const reset = async function (event, binder) {
        event.preventDefault();
        const target = event.target;
        const elements = target?.elements || target?.form?.elements;
        for (const element of elements) {
            const { type, nodeName } = element;
            if ((!type && nodeName !== 'TEXTAREA') ||
                type === 'submit' || type === 'button' || !type)
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
        await binder.compute({ event });
        return false;
    };
    const on = async function on(binder) {
        binder.owner[binder.name] = null;
        const name = binder.name.slice(2);
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
                return binder.compute({ event });
            }
        };
        binder.owner.addEventListener(name, binder.meta.method);
    };
    // const read = async function (binder) {
    //     binder.owner[ binder.name ] = null;
    //     const name = binder.name.slice(2);
    //     if (binder.meta.method) {
    //         binder.owner.removeEventListener(name, binder.meta.method);
    //     }
    //     binder.meta.method = event => {
    //         if (name === 'reset') {
    //             return reset(event, binder);
    //         } else if (name === 'submit') {
    //             return submit(event, binder);
    //         } else {
    //             return binder.compute({ event });
    //         }
    //     };
    //     binder.owner.addEventListener(name, binder.meta.method);
    // };
    // export default { read };

    // const traverse = function (data: any, path: string, paths?: string[]) {
    //     paths = paths || path.replace(/\.?\s*\[(.*?)\]/g, '.$1').split('.');
    //     if (!paths.length) {
    //         return data;
    //     } else {
    //         let part = paths.shift();
    //         const conditional = part.endsWith('?');
    //         if (conditional && typeof data !== 'object') return undefined;
    //         part = conditional ? part.slice(0, -1) : part;
    //         return traverse(data[ part ], path, paths);
    //     }
    // };
    const traverse = function (data, path) {
        const parts = typeof path === 'string' ? path.split('.') : path;
        const part = parts.shift();
        if (!part)
            return data;
        if (typeof data === 'object')
            return traverse(data[part], parts);
        return undefined;
    };

    const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
    const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
    const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
    const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)/g;
    // |({.*?})|(\s*\(+)+\s*)|(\s*(\=)+\s*)|(\s*(\:)+\s*)|(\s*(\?)+\s*)
    const replaceSeperators = /\?\.\[|\]\?\.|\?\.|\s*\.\s*|\s*\[\s*|\s*\]\s*/g;
    const reference = '([a-zA-Z_$\\[\\]][a-zA-Z_$0-9]*|\\s*("|`|\'|{|}|\\?\\s*\\.|\\.|\\[|\\])\\s*)';
    const references = new RegExp(`${reference}+(?!.*\\1)`, 'g');
    const matchAssignment = /([a-zA-Z0-9$_.'`"\[\]]+)\s*=([^=]+|$)/;
    const strips = new RegExp([
        // ';|:',
        '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`',
        `(window|document|this|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${reference}*`,
        `\\btrue\\b|\\bfalse\\b|\\bnull\\b|\\bundefined\\b|\\bNaN\\b|\\bof\\b|\\bin\\b|
    \\bdo\\b|\\bif\\b|\\bfor\\b|\\blet\\b|\\bnew\\b|\\btry\\b|\\bvar\\b|\\bcase\\b|\\belse\\b|\\bwith\\b|\\bawait\\b|
    \\bbreak\\b|\\bcatch\\b|\\bclass\\b|\\bconst\\b|\\bsuper\\b|\\bthrow\\b|\\bwhile\\b|\\byield\\b|\\bdelete\\b|
    \\bexport\\b|\\bimport\\b|\\breturn\\b|\\bswitch\\b|\\bdefault\\b|\\bextends\\b|\\bfinally\\b|\\bcontinue\\b|
    \\bdebugger\\b|\\bfunction\\b|\\barguments\\b|\\btypeof\\b|\\bvoid\\b`,
    ].join('|').replace(/\s|\t|\n/g, ''), 'g');
    // const ignores = [ '$f', '$e', '$v', '$c', '$form', '$event', '$value', '$checked' ];
    const cache = new Map();
    function Statement (statement, data, dynamics, rewrites) {
        if (isOfIn.test(statement)) {
            statement = statement.replace(replaceOfIn, '{{$2}}');
        }
        dynamics = dynamics || {};
        const context = new Proxy(data, {
            has: () => true,
            set: (_, key, value) => {
                if (key[0] === '$')
                    dynamics[key] = value;
                else
                    data[key] = value;
                return true;
            },
            get: (_, key) => {
                if (key in dynamics)
                    return dynamics[key];
                if (key in data)
                    return data[key];
                return window[key];
            }
        });
        const convert = !shouldNotConvert.test(statement);
        let striped = statement.replace(replaceSeperators, '.').replace(replaceOutsideAndSyntax, ';').replace(strips, '');
        if (rewrites) {
            for (const [pattern, value] of rewrites) {
                striped = striped.replace(pattern, (s, g1, g2, g3) => g1 + value + g3);
            }
        }
        const paths = striped.match(references) || [];
        const [, assignment] = striped.match(matchAssignment) || [];
        const assignee = assignment ? traverse.bind(null, context, assignment) : () => undefined;
        let compute;
        if (cache.has(statement)) {
            compute = cache.get(statement).bind(null, context);
        }
        else {
            let code = statement;
            code = code.replace(/{{/g, convert ? `' + (` : '(');
            code = code.replace(/}}/g, convert ? `) + '` : ')');
            code = convert ? `'${code}'` : code;
            // console.log([ statement, code, striped, paths ].join('\n'));
            code = `
            if ($render) {
                $context.$f = $render.form; $context.$form = $render.form;
                $context.$e = $render.event; $context.$event = $render.event;
                $context.$v = $render.value; $context.$value = $render.value;
                $context.$c = $render.checked; $context.$checked = $render.checked;
            }
            with ($context) {
                return ${code};
            }
        `;
            compute = new Function('$context', '$render', code);
            cache.set(statement, compute);
            // try {
            //     const handler = {
            //         has: () => true,
            //         apply: () => undefined,
            //         set: () => {
            //             return true;
            //         },
            //         get: (target, key) => {
            //             if (typeof key === 'string' && target[ key ] === undefined) {
            //                 const $path = target.$path ? `${target.$path}.${key}` : key;
            //                 console.log(key, $path);
            //                 target[ key ] = new Proxy({ $path }, handler);
            //             }
            //             return target[ key ];
            //         }
            //     };
            //     compute(new Proxy({ $path: '' }, handler));
            // } catch { }
            compute = compute.bind(null, context);
        }
        return { compute, assignee, paths };
    }

    const TN = Node.TEXT_NODE;
    const EN = Node.ELEMENT_NODE;
    const AN = Node.ATTRIBUTE_NODE;
    const tick = Promise.resolve();
    // const empty = /\s*{{\s*}}\s*/;
    class Binder {
        prefix = 'o-';
        syntaxEnd = '}}';
        syntaxStart = '{{';
        syntaxLength = 2;
        syntaxMatch = new RegExp('{{.*?}}');
        prefixReplace = new RegExp('^o-');
        syntaxReplace = new RegExp('{{|}}', 'g');
        nodeBinders = new Map();
        pathBinders = new Map();
        binders = {
            standard,
            checked,
            value,
            each,
            html,
            text,
            on,
        };
        get(data) {
            if (typeof data === 'string') {
                return this.pathBinders.get(data);
            }
            else {
                return this.nodeBinders.get(data);
            }
        }
        async unbind(node) {
            // need to figureout how to handle boolean attributes
            const nodeBinders = this.nodeBinders.get(node);
            if (!nodeBinders)
                return;
            for (const [path] of nodeBinders) {
                this.pathBinders.get(path).delete(node);
            }
            this.nodeBinders.delete(node);
        }
        async bind(node, container, name, value, owner, dynamics, rewrites) {
            const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
            // const render = this.binders[ type ];
            const { compute, assignee, paths } = Statement(value, container.data, dynamics, rewrites);
            if (!paths.length)
                paths.push('');
            const binder = {
                render: undefined,
                binder: this, meta: {}, busy: false,
                type, assignee, compute, paths,
                node, owner, name, value,
                dynamics, rewrites,
                container,
            };
            binder.render = this.binders[type].bind(null, binder);
            for (const path of paths) {
                if (path) {
                    if (!this.nodeBinders.has(node)) {
                        this.nodeBinders.set(node, new Map([[path, binder]]));
                    }
                    else {
                        this.nodeBinders.get(node).set(path, binder);
                    }
                    if (!this.pathBinders.has(path)) {
                        this.pathBinders.set(path, new Map([[node, binder]]));
                    }
                    else {
                        this.pathBinders.get(path).set(node, binder);
                    }
                }
                tick.then(binder.render);
                // binder.render();
            }
        }
        ;
        async remove(node) {
            if (node.nodeType === AN || node.nodeType === TN) {
                tick.then(this.unbind.bind(this, node));
            }
            else if (node.nodeType === EN) {
                const attributes = node.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    tick.then(this.unbind.bind(this, attributes[i]));
                }
                let child = node.firstChild;
                while (child) {
                    tick.then(this.remove.bind(this, child));
                    child = child.nextSibling;
                }
            }
        }
        async add(node, container, dynamics, rewrites) {
            if (node.nodeType === AN) {
                const attribute = node;
                if (this.syntaxMatch.test(attribute.value)) {
                    tick.then(this.bind.bind(this, node, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                }
            }
            else if (node.nodeType === TN) {
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
                    tick.then(this.add.bind(this, split, container, dynamics, rewrites));
                }
                tick.then(this.bind.bind(this, node, container, 'text', node.nodeValue, node, dynamics, rewrites));
            }
            else if (node.nodeType === EN) {
                let each = false;
                const attributes = node.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    if (attribute.name === 'each' || attribute.name === `${this.prefix}each`)
                        each = true;
                    if (this.syntaxMatch.test(attribute.value)) {
                        tick.then(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                    }
                }
                if (each)
                    return;
                let child = node.firstChild;
                while (child) {
                    tick.then(this.add.bind(this, child, container, dynamics, rewrites));
                    child = child.nextSibling;
                }
            }
        }
    }

    var Css = new class Css {
        #data = new Map();
        #style = document.createElement('style');
        #support = !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)');
        constructor() {
            this.#style.appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
            this.#style.setAttribute('title', 'oxe');
            document.head.appendChild(this.#style);
        }
        scope(name, text) {
            return text
                .replace(/\t|\n\s*/g, '')
                // .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
                .replace(/:host/g, name);
        }
        transform(text = '') {
            if (!this.#support) {
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
            const item = this.#data.get(name);
            if (!item || item.count === 0)
                return;
            item.count--;
            if (item.count === 0 && this.#style.contains(item.node)) {
                this.#style.removeChild(item.node);
            }
        }
        attach(name, text) {
            const item = this.#data.get(name) || { count: 0, node: this.node(name, text) };
            if (item) {
                item.count++;
            }
            else {
                this.#data.set(name, item);
            }
            if (!this.#style.contains(item.node)) {
                this.#style.appendChild(item.node);
            }
        }
        node(name, text) {
            return document.createTextNode(this.scope(name, this.transform(text)));
        }
    };

    // const tick = Promise.resolve();
    class Component extends HTMLElement {
        static attributes;
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        #root;
        #binder;
        #flag = false;
        #name = this.nodeName.toLowerCase();
        // this overwrites extends methods
        // adopted: () => void;
        // rendered: () => void;
        // connected: () => void;
        // disconnected: () => void;
        // attributed: (name: string, from: string, to: string) => void;
        #adopted;
        #rendered;
        #connected;
        #disconnected;
        #attributed;
        // #css: string = typeof (this as any).css === 'string' ? (this as any).css : '';
        // #html: string = typeof (this as any).html === 'string' ? (this as any).html : '';
        // #data: object = typeof (this as any).data === 'object' ? (this as any).data : {};
        // #adopt: boolean = typeof (this as any).adopt === 'boolean' ? (this as any).adopt : false;
        // #shadow: boolean = typeof (this as any).shadow === 'boolean' ? (this as any).shadow : false;
        css = '';
        html = '';
        data = {};
        adopt = false;
        shadow = false;
        get root() { return this.#root; }
        get binder() { return Binder; }
        constructor() {
            super();
            this.#binder = new Binder();
            this.#adopted = this.adopted;
            this.#rendered = this.rendered;
            this.#connected = this.connected;
            this.#attributed = this.attributed;
            this.#disconnected = this.disconnected;
            if (this.shadow && 'attachShadow' in document.body) {
                this.#root = this.attachShadow({ mode: 'open' });
            }
            else if (this.shadow && 'createShadowRoot' in document.body) {
                this.#root = this.createShadowRoot();
            }
            else {
                this.#root = this;
            }
        }
        async render() {
            const tasks = [];
            const observer$1 = async (path) => {
                const binders = this.#binder.pathBinders.get(path);
                if (!binders)
                    return;
                const tasks = [];
                for (const binder of binders.values()) {
                    tasks.push(binder.render());
                    // tick.then(binder.render);
                }
                return Promise.all(tasks);
            };
            this.data = observer(this.data, observer$1);
            if (this.adopt) {
                let child = this.firstChild;
                while (child) {
                    // tick.then(this.#binder.add.bind(this.#binder, child, this));
                    tasks.push(this.#binder.add(child, this));
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
                tasks.push(this.#binder.add(child, this));
                child = child.nextSibling;
            }
            await Promise.all(tasks);
            this.#root.appendChild(template.content);
        }
        async attributeChangedCallback(name, from, to) {
            await this.#attributed(name, from, to);
        }
        async adoptedCallback() {
            if (this.#adopted)
                await this.#adopted();
        }
        async disconnectedCallback() {
            Css.detach(this.#name);
            if (this.#disconnected)
                await this.#disconnected();
        }
        async connectedCallback() {
            try {
                Css.attach(this.#name, this.css);
                if (!this.#flag) {
                    this.#flag = true;
                    await this.render();
                    if (this.#rendered)
                        await this.#rendered();
                }
                if (this.#connected)
                    await this.#connected();
            }
            catch (error) {
                console.error(error);
            }
        }
    }

    var Fetcher = new class Fetcher {
        option = {};
        types = [
            'json',
            'text',
            'blob',
            'formData',
            'arrayBuffer'
        ];
        mime = {
            xml: 'text/xml; charset=utf-8',
            html: 'text/html; charset=utf-8',
            text: 'text/plain; charset=utf-8',
            json: 'application/json; charset=utf-8',
            js: 'application/javascript; charset=utf-8'
        };
        async setup(option = {}) {
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
                await option.before(context);
            if (context.aborted)
                return;
            if (context.body) {
                if (context.method === 'GET') {
                    context.url = context.url + '?' + await this.serialize(context.body);
                    // } else if (context.contentType === 'json') {
                }
                else if (typeof context.body === 'object') {
                    context.body = JSON.stringify(context.body);
                }
            }
            const result = await window.fetch(context.url, context);
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
            context.body = await result[type]();
            if (typeof option.after === 'function')
                await option.after(context);
            if (context.aborted)
                return;
            return context;
        }
    };

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
    const load = async function (url) {
        if (!url)
            throw new Error('Oxe.load - url required');
        url = resolve(url);
        // window.REGULAR_SUPPORT = false;
        // window.DYNAMIC_SUPPORT = false;
        if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
            await run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
            window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
        }
        if (window.DYNAMIC_SUPPORT === true) {
            // console.log('native import');
            await run(`window.MODULES["${url}"] = import("${url}");`);
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

    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Router = new class Router {
        #target;
        #data = {};
        #folder = '';
        #dynamic = true;
        #contain = false;
        #external;
        #after;
        #before;
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
            const queries = window.location.search.slice(1).split('&');
            const result = {};
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
        back() { window.history.back(); }
        forward() { window.history.forward(); }
        reload() { window.location.reload(); }
        redirect(href) { window.location.href = href; }
        async setup(option) {
            if ('folder' in option)
                this.#folder = option.folder;
            if ('contain' in option)
                this.#contain = option.contain;
            if ('dynamic' in option)
                this.#dynamic = option.dynamic;
            if ('external' in option)
                this.#external = option.external;
            if ('before' in option)
                this.#before = option.before;
            if ('after' in option)
                this.#after = option.after;
            this.#target = option.target instanceof Element ? option.target : document.body.querySelector(option.target);
            if (this.#dynamic) {
                window.addEventListener('popstate', this.#state.bind(this), true);
                if (this.#contain) {
                    this.#target.addEventListener('click', this.#click.bind(this), true);
                }
                else {
                    window.document.addEventListener('click', this.#click.bind(this), true);
                }
            }
            return this.replace(window.location.href);
        }
        async assign(data) {
            return this.#go(data, { mode: 'push' });
        }
        async replace(data) {
            return this.#go(data, { mode: 'replace' });
        }
        #location(href = window.location.href) {
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
        }
        async #go(path, options = {}) {
            // if (options.query) {
            //     path += Query(options.query);
            // }
            const mode = options.mode || 'push';
            const location = this.#location(path);
            if (this.#before)
                await this.#before(location);
            if (!this.#dynamic) {
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
            if (location.pathname in this.#data) {
                element = this.#data[location.pathname];
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
                load$1 = `${this.#folder}/${load$1}.js`.replace(/\/+/g, '/');
                load$1 = absolute(load$1);
                let component;
                try {
                    component = (await load(load$1)).default;
                }
                catch (error) {
                    if (error.message === `Failed to fetch dynamically imported module: ${window.location.origin}${load$1}`) {
                        component = (await load(absolute(`${this.#folder}/all.js`))).default;
                    }
                    else {
                        throw error;
                    }
                }
                const name = 'route' + path.replace(/\/+/g, '-');
                window.customElements.define(name, component);
                element = window.document.createElement(name);
                this.#data[location.pathname] = element;
            }
            const keywords = document.querySelector('meta[name="keywords"]');
            const description = document.querySelector('meta[name="description"]');
            if (element.title)
                window.document.title = element.title;
            if (element.keywords && keywords)
                keywords.setAttribute('content', element.keywords);
            if (element.description && description)
                description.setAttribute('content', element.description);
            while (this.#target.firstChild) {
                this.#target.removeChild(this.#target.firstChild);
            }
            this.#target.appendChild(element);
            if (this.#after)
                await this.#after(location);
            window.dispatchEvent(new CustomEvent('router', { detail: location }));
        }
        async #state(event) {
            await this.replace(event.state.href);
            window.scroll(event.state.top, 0);
        }
        async #click(event) {
            // ignore canceled events, modified clicks, and right clicks
            if (event.target.type ||
                event.button !== 0 ||
                event.defaultPrevented ||
                event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
                return;
            // if shadow dom use
            let target = event.path ? event.path[0] : event.target;
            let parent = target.parentElement;
            if (this.#contain) {
                while (parent) {
                    if (parent.nodeName === this.#target.nodeName) {
                        break;
                    }
                    else {
                        parent = parent.parentElement;
                    }
                }
                if (parent.nodeName !== this.#target.nodeName) {
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
            if (this.#external &&
                (this.#external instanceof RegExp && this.#external.test(target.href) ||
                    typeof this.#external === 'function' && this.#external(target.href) ||
                    typeof this.#external === 'string' && this.#external === target.href))
                return;
            event.preventDefault();
            this.assign(target.href);
        }
    };
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
    async function Define(component) {
        if (typeof component === 'string') {
            const loaded = await load(component);
            return Define(loaded.default);
        }
        else if (component instanceof Array) {
            return Promise.all(component.map(data => Define(data)));
        }
        else {
            const name = toDash(component.name);
            window.customElements.define(name, component);
        }
    }

    // declare global {
    //     interface Window {
    //         Reflect: any;
    //         NodeList: any;
    //         CustomEvent: any;
    //     }
    // }
    // if (typeof window.CustomEvent !== 'function') {
    //     window.CustomEvent = function CustomEvent (event, options) {
    //         'use strict';
    //         options = options || { bubbles: false, cancelable: false, detail: null };
    //         var customEvent = document.createEvent('CustomEvent');
    //         customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
    //         return customEvent;
    //     };
    // }
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
        Component = Component;
        component = Component;
        Fetcher = Fetcher;
        fetcher = Fetcher;
        Router = Router;
        router = Router;
        Define = Define;
        define = Define;
        Load = load;
        load = load;
        Css = Css;
        css = Css;
    });

    return index;

})));
