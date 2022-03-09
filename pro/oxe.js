
/*!
    Name: oxe
    Version: 7.0.0
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

    const promise = Promise.resolve();
    function tick(method) {
        return promise.then(method);
    }

    const dataGet = function (event, reference, target, key, receiver) {
        if (key === 'x')
            return { reference };
        const value = Reflect.get(target, key, receiver);
        if (value && typeof value === 'object') {
            reference = reference ? `${reference}.${key}` : `${key}`;
            return new Proxy(value, {
                get: dataGet.bind(null, event, reference),
                set: dataSet.bind(null, event, reference),
                deleteProperty: dataDelete.bind(null, event, reference)
            });
        }
        return value;
    };
    const dataDelete = function (event, reference, target, key) {
        if (target instanceof Array) {
            target.splice(key, 1);
        }
        else {
            Reflect.deleteProperty(target, key);
        }
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'derender'));
        return true;
    };
    const dataSet = function (event, reference, target, key, to, receiver) {
        const from = Reflect.get(target, key, receiver);
        if (key === 'length') {
            tick(event.bind(null, reference, 'render'));
            tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
            return true;
        }
        else if (from === to || isNaN(from) && to === isNaN(to)) {
            return true;
        }
        Reflect.set(target, key, to, receiver);
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    };
    const dataEvent = function (data, reference, type) {
        const binders = data.get(reference);
        if (binders) {
            for (const binder of binders) {
                binder[type]();
            }
        }
    };

    var booleans = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];

    function format(data) {
        return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
    }

    const standardRender = function (binder) {
        let data = binder.compute();
        const boolean = booleans.includes(binder.name);
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
    };
    const standardUnrender = function (binder) {
        const boolean = booleans.includes(binder.name);
        if (boolean) {
            binder.owner.removeAttribute(binder.name);
        }
        else {
            binder.owner.setAttribute(binder.name, '');
        }
    };
    var standard = { render: standardRender, unrender: standardUnrender };

    const flag = Symbol('RadioFlag');
    const handler = function (binder, event) {
        const checked = binder.owner.checked;
        const computed = binder.compute({ $event: event, $checked: checked, $assignment: !!event });
        if (computed) {
            binder.owner.setAttributeNode(binder.node);
        }
        else {
            binder.owner.removeAttribute('checked');
        }
    };
    const checkedRender = function (binder) {
        if (!binder.meta.setup) {
            binder.node.value = '';
            binder.meta.setup = true;
            if (binder.owner.type === 'radio') {
                binder.owner.addEventListener('input', event => {
                    if (event.detail === flag)
                        return handler(binder, event);
                    const parent = binder.owner.form || binder.owner.getRootNode();
                    const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                    const input = new CustomEvent('input', { detail: flag });
                    for (const radio of radios) {
                        if (radio === event.target) {
                            handler(binder, event);
                        }
                        else {
                            let checked;
                            const bounds = binder.container.binders.get(binder.owner);
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
                });
            }
            else {
                binder.owner.addEventListener('input', event => handler(binder, event));
            }
        }
        handler(binder);
    };
    const checkedUnrender = function (binder) {
        binder.owner.removeAttribute('checked');
    };
    var checked = { render: checkedRender, unrender: checkedUnrender };

    const inheritRender = function (binder) {
        var _a, _b;
        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.node.value = '';
        }
        if (!binder.owner.inherited) {
            return console.warn(`inherited not implemented ${binder.owner.localName}`);
        }
        const inherited = binder.compute();
        (_b = (_a = binder.owner).inherited) === null || _b === void 0 ? void 0 : _b.call(_a, inherited);
    };
    const inheritUnrender = function (binder) {
        var _a, _b;
        if (!binder.owner.inherited) {
            return console.warn(`inherited not implemented ${binder.owner.localName}`);
        }
        (_b = (_a = binder.owner).inherited) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    var inherit = { render: inheritRender, unrender: inheritUnrender };

    var dates = ['date', 'datetime-local', 'month', 'time', 'week'];

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
        const { owner } = binder;
        const { type } = owner;
        if (type === 'select-one') {
            const [option] = owner.selectedOptions;
            const value = option ? '$value' in option ? option.$value : option.value : undefined;
            binder.compute({ $event: event, $value: value, $assignment: true });
        }
        else if (type === 'select-multiple') {
            const value = [];
            for (const option of owner.selectedOptions) {
                value.push('$value' in option ? option.$value : option.value);
            }
            binder.compute({ $event: event, $value: value, $assignment: true });
        }
        else if (type === 'number' || type === 'range') {
            binder.compute({ $event: event, $value: owner.valueAsNumber, $assignment: true });
        }
        else if (dates.includes(type)) {
            const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
            binder.compute({ $event: event, $value: value, $assignment: true });
        }
        else {
            const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
            const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
            binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
        }
    };
    const valueRender = function (binder) {
        const { owner, meta } = binder;
        if (!meta.setup) {
            meta.setup = true;
            owner.addEventListener('input', event => input(binder, event));
        }
        const computed = binder.compute({ $assignment: false });
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
        else if (dates.includes(binder.owner.type)) {
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
    };
    const valueUnrender = function (binder) {
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
    };
    var value = { render: valueRender, unrender: valueUnrender };

    const whitespace = /\s+/;
    const eachHas = function (binder, indexValue, keyValue, target, key) {
        return key === binder.meta.variableName ||
            key === binder.meta.indexName ||
            key === binder.meta.keyName ||
            key === '$index' ||
            key === '$item' ||
            key === '$key' ||
            key in target;
    };
    const eachGet = function (binder, indexValue, keyValue, target, key) {
        if (key === binder.meta.variableName || key === '$item') {
            return binder.meta.data[keyValue];
        }
        else if (key === binder.meta.indexName || key === '$index') {
            return indexValue;
        }
        else if (key === binder.meta.keyName || '$key') {
            return keyValue;
        }
        else {
            return binder.context[key];
        }
    };
    const eachSet = function (binder, indexValue, keyValue, target, key, value) {
        if (key === binder.meta.variableName || key === '$item') {
            binder.meta.data[keyValue] = value;
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
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        let node;
        while (node = binder.owner.lastChild)
            binder.binder.remove(binder.owner.removeChild(node));
        while (node = binder.meta.queueElement.content.lastChild)
            binder.meta.queueElement.content.removeChild(node);
    };
    const eachRender = function (binder) {
        var _a;
        const [data, variable, index, key] = binder.compute();
        const [reference] = binder.references;
        binder.meta.data = data;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        if (!binder.meta.setup) {
            binder.node.value = '';
            binder.meta.keys = [];
            binder.meta.setup = true;
            binder.meta.targetLength = 0;
            binder.meta.currentLength = 0;
            binder.meta.templateLength = 0;
            binder.meta.queueElement = document.createElement('template');
            binder.meta.templateElement = document.createElement('template');
            let node = binder.owner.firstChild;
            while (node) {
                if (node.nodeType === 3 && whitespace.test(node.nodeValue)) {
                    binder.owner.removeChild(node);
                }
                else {
                    binder.meta.templateLength++;
                    binder.meta.templateElement.content.appendChild(node);
                }
                node = binder.owner.firstChild;
            }
        }
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
                    binder.binder.remove(node);
                }
                binder.meta.currentLength--;
            }
        }
        else if (binder.meta.currentLength < binder.meta.targetLength) {
            console.time('each while');
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const $key = (_a = binder.meta.keys[binder.meta.currentLength]) !== null && _a !== void 0 ? _a : binder.meta.currentLength;
                const $index = binder.meta.currentLength++;
                const context = new Proxy(binder.context, {
                    has: eachHas.bind(null, binder, $index, $key),
                    get: eachGet.bind(null, binder, $index, $key),
                    set: eachSet.bind(null, binder, $index, $key),
                });
                let rewrites;
                if (binder.rewrites) {
                    rewrites = [...binder.rewrites, [variable, `${reference}.${$index}`]];
                }
                else {
                    rewrites = [[variable, `${reference}.${$index}`]];
                }
                const clone = binder.meta.templateElement.content.cloneNode(true);
                let node = clone.firstChild;
                while (node) {
                    binder.container.binds(node, context, rewrites);
                    node = node.nextSibling;
                }
                binder.meta.queueElement.content.appendChild(clone);
            }
            console.timeEnd('each while');
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            binder.owner.appendChild(binder.meta.queueElement.content);
        }
    };
    var each = { render: eachRender, unrender: eachUnrender };

    const htmlRender = function (binder) {
        let data = binder.compute();
        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }
        let removeChild;
        while (removeChild = binder.owner.lastChild) {
            binder.owner.removeChild(removeChild);
            binder.binder.remove(removeChild);
        }
        const template = document.createElement('template');
        template.innerHTML = data;
        let addChild = template.content.firstChild;
        while (addChild) {
            binder.container.binds(addChild, binder.container);
            addChild = addChild.nextSibling;
        }
        binder.owner.appendChild(template.content);
    };
    const htmlUnrender = function (binder) {
        let node;
        while (node = binder.owner.lastChild) {
            binder.container.unbinds(node);
            binder.owner.removeChild(node);
        }
    };
    var html = { render: htmlRender, unrender: htmlUnrender };

    const textRender = function (binder) {
        let data = binder.compute();
        binder.owner.textContent = format(data);
    };
    const textUnrender = function (binder) {
        binder.owner.textContent = '';
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
        event.preventDefault();
        const form = {};
        const target = event.target;
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
        binder.compute({ $form: form, $event: event });
        if (target.getAttribute('reset'))
            target.reset();
        return false;
    };
    const reset = function (event, binder) {
        var _a;
        event.preventDefault();
        const target = event.target;
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
        binder.compute({ $event: event });
        return false;
    };
    const onRender = function (binder) {
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
    };
    const onUnrender = function (binder) {
        binder.owner[binder.name] = null;
        const name = binder.name.slice(2);
        if (binder.meta.method) {
            binder.owner.removeEventListener(name, binder.meta.method);
        }
    };
    var on = { render: onRender, unrender: onUnrender };

    const caches = new Map();
    const splitPattern = /\s*{{\s*|\s*}}\s*/;
    const bracketPattern = /({{)|(}})/;
    const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
    const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
    const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');
    const computer = function (binder) {
        let cache = caches.get(binder.value);
        if (cache)
            return cache.bind(null, binder.context);
        let reference = '';
        let assignment = '';
        let code = binder.value;
        const isValue = binder.node.name === 'value';
        const isChecked = binder.node.name === 'checked';
        const convert = code.split(splitPattern).filter(part => part).length > 1;
        code = code.replace(codePattern, function (match, string, assignee, assigneeLeft, r, assigneeMiddle, assigneeRight, bracketLeft, bracketRight) {
            if (string)
                return string;
            if (bracketLeft)
                return convert ? `' + (` : '(';
            if (bracketRight)
                return convert ? `) + '` : ')';
            if (assignee) {
                if (isValue || isChecked) {
                    reference = r;
                    assignment = assigneeLeft + assigneeRight;
                    return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                }
                else {
                    return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                }
            }
        });
        code = convert ? `'${code}'` : code;
        if (assignment) {
            code = `
            if ($assignment) {
                return ${code};
            } else {
                ${isValue ? `$value = ${reference || `undefined`};` : ''}
                ${isChecked ? `$checked = ${reference || `undefined`};` : ''}
                return ${assignment || code};
            }
        `;
        }
        else {
            code = `return ${code};`;
        }
        code = `
    try {
        $instance = $instance || {};
        with ($context) {
            with ($instance) {
                ${code}
            }
        }
    } catch (error){
        console.error(error);
    }
    `;
        cache = new Function('$context', '$instance', code);
        caches.set(binder.value, cache);
        return cache.bind(null, binder.context);
    };

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
        '([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)'
    ].join('|').replace(/\s|\t|\n/g, ''), 'g');
    const cache = new Map();
    const parser = function (data) {
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
        return references;
    };

    function dash(data) {
        return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    var _XElement_setup, _XElement_syntaxEnd, _XElement_syntaxStart, _XElement_syntaxLength, _XElement_syntaxMatch, _XElement_connectedEvent, _XElement_connectingEvent, _XElement_template;
    const TEXT = Node.TEXT_NODE;
    const ELEMENT = Node.ELEMENT_NODE;
    class XElement extends HTMLElement {
        constructor() {
            var _a, _b, _c, _d, _e, _f, _g;
            super();
            _XElement_setup.set(this, false);
            _XElement_syntaxEnd.set(this, '}}');
            _XElement_syntaxStart.set(this, '{{');
            _XElement_syntaxLength.set(this, 2);
            _XElement_syntaxMatch.set(this, new RegExp('{{.*?}}'));
            _XElement_connectedEvent.set(this, new Event('connected'));
            _XElement_connectingEvent.set(this, new Event('connecting'));
            _XElement_template.set(this, document.createElement('template'));
            this.binders = new Map();
            this.handlers = {
                on,
                text,
                html,
                each,
                value,
                checked,
                inherit,
                standard
            };
            const style = (_b = (_a = this.constructor).style) === null || _b === void 0 ? void 0 : _b.call(_a);
            const data = (_d = (_c = this.constructor).data) === null || _d === void 0 ? void 0 : _d.call(_c);
            const shadow = (_f = (_e = this.constructor).shadow) === null || _f === void 0 ? void 0 : _f.call(_e);
            this.shadow = (_g = this.shadowRoot) !== null && _g !== void 0 ? _g : this.attachShadow({ mode: 'open' });
            this.data = new Proxy(data, {
                get: dataGet.bind(null, dataEvent.bind(null, this.binders), ''),
                set: dataSet.bind(null, dataEvent.bind(null, this.binders), ''),
                deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.binders), '')
            });
            if (typeof style === 'string') {
                __classPrivateFieldGet(this, _XElement_template, "f").innerHTML = `<style>${style}</style>`;
                this.shadow.prepend(__classPrivateFieldGet(this, _XElement_template, "f").content);
            }
            else if (shadow instanceof Element) {
                this.shadow.prepend(style);
            }
            if (typeof shadow === 'string') {
                __classPrivateFieldGet(this, _XElement_template, "f").innerHTML = shadow;
                this.shadow.append(__classPrivateFieldGet(this, _XElement_template, "f").content);
            }
            else if (shadow instanceof Element) {
                this.shadow.append(shadow);
            }
            let node = this.shadow.firstChild;
            while (node) {
                this.binds(node);
                node = node.nextSibling;
            }
        }
        static get observedAttributes() {
            return this.attributes();
        }
        static define(name, constructor) {
            constructor = constructor !== null && constructor !== void 0 ? constructor : this;
            name = name !== null && name !== void 0 ? name : dash(this.name);
            customElements.define(name, constructor);
        }
        static defined(name) {
            name = name !== null && name !== void 0 ? name : dash(this.name);
            return customElements.whenDefined(name);
        }
        unbind(node) {
            var _a;
            const binders = this.binders.get(node);
            if (!binders)
                return;
            for (const binder of binders) {
                for (const reference of binder.references) {
                    (_a = this.binders.get(reference)) === null || _a === void 0 ? void 0 : _a.delete(binder);
                    if (!this.binders.get(reference).size)
                        this.binders.delete(reference);
                }
            }
            this.binders.delete(node);
        }
        bind(node, name, value, owner, context, rewrites) {
            const type = name.startsWith('on') ? 'on' : name in this.handlers ? name : 'standard';
            const handler = this.handlers[type];
            const container = this;
            context = context !== null && context !== void 0 ? context : this.data;
            const binder = {
                meta: {},
                binder: this,
                render: undefined,
                compute: undefined,
                unrender: undefined,
                references: undefined,
                rewrites: rewrites !== null && rewrites !== void 0 ? rewrites : [],
                node, owner, name, value, context, container, type,
            };
            const references = parser(value);
            const compute = computer(binder);
            binder.compute = compute;
            binder.references = [...references];
            binder.render = handler.render.bind(null, binder);
            binder.unrender = handler.unrender.bind(null, binder);
            for (let i = 0; i < binder.references.length; i++) {
                if (rewrites) {
                    for (const [name, value] of rewrites) {
                        binder.references[i] = binder.references[i].replace(name, value);
                    }
                }
                if (this.binders.has(binder.references[i])) {
                    this.binders.get(binder.references[i]).add(binder);
                }
                else {
                    this.binders.set(binder.references[i], new Set([binder]));
                }
            }
            if (this.binders.has(binder.owner)) {
                this.binders.get(binder.owner).add(binder);
            }
            else {
                this.binders.set(binder.owner, new Set([binder]));
            }
            binder.render();
        }
        unbinds(node) {
            if (node.nodeType === TEXT) {
                this.unbind(node);
            }
            else if (node.nodeType === ELEMENT) {
                this.unbind(node);
                const attributes = node.attributes;
                for (const attribute of attributes) {
                    this.unbind(attribute);
                }
                let child = node.firstChild;
                while (child) {
                    this.unbinds(child);
                    child = child.nextSibling;
                }
            }
        }
        binds(node, context, rewrites) {
            if (node.nodeType === TEXT) {
                const start = node.nodeValue.indexOf(__classPrivateFieldGet(this, _XElement_syntaxStart, "f"));
                if (start === -1)
                    return;
                if (start !== 0)
                    node = node.splitText(start);
                const end = node.nodeValue.indexOf(__classPrivateFieldGet(this, _XElement_syntaxEnd, "f"));
                if (end === -1)
                    return;
                if (end + __classPrivateFieldGet(this, _XElement_syntaxLength, "f") !== node.nodeValue.length) {
                    const split = node.splitText(end + __classPrivateFieldGet(this, _XElement_syntaxLength, "f"));
                    this.binds(split, context, rewrites);
                }
                this.bind(node, 'text', node.nodeValue, node, context, rewrites);
            }
            else if (node.nodeType === ELEMENT) {
                const attributes = node.attributes;
                const inherit = attributes['inherit'];
                if (inherit)
                    this.bind(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);
                const each = attributes['each'];
                if (each)
                    this.bind(each, each.name, each.value, each.ownerElement, context, rewrites);
                if (!each && !inherit && !(node instanceof XElement)) {
                    let child = node.firstChild;
                    while (child) {
                        this.binds(child, context, rewrites);
                        child = child.nextSibling;
                    }
                }
                for (const attribute of attributes) {
                    if (attribute.name !== 'each' && attribute.name !== 'inherit' && __classPrivateFieldGet(this, _XElement_syntaxMatch, "f").test(attribute.value)) {
                        this.bind(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    }
                }
            }
        }
        attributeChangedCallback(name, from, to) {
            var _a, _b;
            (_b = (_a = this).attributed) === null || _b === void 0 ? void 0 : _b.call(_a, name, from, to);
        }
        adoptedCallback() {
            var _a, _b;
            (_b = (_a = this).adopted) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        disconnectedCallback() {
            var _a, _b;
            (_b = (_a = this).disconnected) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        connectedCallback() {
            var _a, _b;
            this.dispatchEvent(__classPrivateFieldGet(this, _XElement_connectingEvent, "f"));
            if (!__classPrivateFieldGet(this, _XElement_setup, "f")) {
                __classPrivateFieldSet(this, _XElement_setup, true, "f");
            }
            (_b = (_a = this).connected) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.dispatchEvent(__classPrivateFieldGet(this, _XElement_connectedEvent, "f"));
        }
    }
    _XElement_setup = new WeakMap(), _XElement_syntaxEnd = new WeakMap(), _XElement_syntaxStart = new WeakMap(), _XElement_syntaxLength = new WeakMap(), _XElement_syntaxMatch = new WeakMap(), _XElement_connectedEvent = new WeakMap(), _XElement_connectingEvent = new WeakMap(), _XElement_template = new WeakMap();
    XElement.data = () => ({});
    XElement.attributes = () => [];

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
                code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
            }
            else {
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

    var _XRouter_instances, _XRouter_target, _XRouter_data, _XRouter_folder, _XRouter_cache, _XRouter_dynamic, _XRouter_contain, _XRouter_external, _XRouter_after, _XRouter_before, _XRouter_location, _XRouter_go, _XRouter_state, _XRouter_click, _a;
    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Router = new (_a = class XRouter {
            constructor() {
                _XRouter_instances.add(this);
                _XRouter_target.set(this, void 0);
                _XRouter_data.set(this, {});
                _XRouter_folder.set(this, '');
                _XRouter_cache.set(this, true);
                _XRouter_dynamic.set(this, true);
                _XRouter_contain.set(this, false);
                _XRouter_external.set(this, void 0);
                _XRouter_after.set(this, void 0);
                _XRouter_before.set(this, void 0);
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
            back() { window.history.back(); }
            forward() { window.history.forward(); }
            reload() { window.location.reload(); }
            redirect(href) { window.location.href = href; }
            setup(option) {
                return __awaiter(this, void 0, void 0, function* () {
                    if ('folder' in option)
                        __classPrivateFieldSet(this, _XRouter_folder, option.folder, "f");
                    if ('contain' in option)
                        __classPrivateFieldSet(this, _XRouter_contain, option.contain, "f");
                    if ('dynamic' in option)
                        __classPrivateFieldSet(this, _XRouter_dynamic, option.dynamic, "f");
                    if ('external' in option)
                        __classPrivateFieldSet(this, _XRouter_external, option.external, "f");
                    if ('before' in option)
                        __classPrivateFieldSet(this, _XRouter_before, option.before, "f");
                    if ('after' in option)
                        __classPrivateFieldSet(this, _XRouter_after, option.after, "f");
                    if ('cache' in option)
                        __classPrivateFieldSet(this, _XRouter_cache, option.cache, "f");
                    __classPrivateFieldSet(this, _XRouter_target, option.target instanceof Element ? option.target : document.body.querySelector(option.target), "f");
                    if (__classPrivateFieldGet(this, _XRouter_dynamic, "f")) {
                        window.addEventListener('popstate', __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_state).bind(this), true);
                        if (__classPrivateFieldGet(this, _XRouter_contain, "f")) {
                            __classPrivateFieldGet(this, _XRouter_target, "f").addEventListener('click', __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_click).bind(this), true);
                        }
                        else {
                            window.document.addEventListener('click', __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_click).bind(this), true);
                        }
                    }
                    return this.replace(window.location.href);
                });
            }
            assign(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_go).call(this, data, { mode: 'push' });
                });
            }
            replace(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    return __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_go).call(this, data, { mode: 'replace' });
                });
            }
        },
        _XRouter_target = new WeakMap(),
        _XRouter_data = new WeakMap(),
        _XRouter_folder = new WeakMap(),
        _XRouter_cache = new WeakMap(),
        _XRouter_dynamic = new WeakMap(),
        _XRouter_contain = new WeakMap(),
        _XRouter_external = new WeakMap(),
        _XRouter_after = new WeakMap(),
        _XRouter_before = new WeakMap(),
        _XRouter_instances = new WeakSet(),
        _XRouter_location = function _XRouter_location(href = window.location.href) {
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
        },
        _XRouter_go = function _XRouter_go(path, options = {}) {
            return __awaiter(this, void 0, void 0, function* () {
                const mode = options.mode || 'push';
                const location = __classPrivateFieldGet(this, _XRouter_instances, "m", _XRouter_location).call(this, path);
                let element;
                if (location.pathname in __classPrivateFieldGet(this, _XRouter_data, "f")) {
                    const route = __classPrivateFieldGet(this, _XRouter_data, "f")[location.pathname];
                    element = __classPrivateFieldGet(this, _XRouter_cache, "f") ? route.element : window.document.createElement(route.name);
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
                    load$1 = `${__classPrivateFieldGet(this, _XRouter_folder, "f")}/${load$1}.js`.replace(/\/+/g, '/');
                    load$1 = absolute(load$1);
                    let component;
                    try {
                        component = (yield load(load$1)).default;
                    }
                    catch (error) {
                        if (error.message === `Failed to fetch dynamically imported module: ${window.location.origin}${load$1}`) {
                            component = (yield load(absolute(`${__classPrivateFieldGet(this, _XRouter_folder, "f")}/all.js`))).default;
                        }
                        else {
                            throw error;
                        }
                    }
                    const name = 'route' + path.replace(/\/+/g, '-');
                    window.customElements.define(name, component);
                    element = window.document.createElement(name);
                    __classPrivateFieldGet(this, _XRouter_data, "f")[location.pathname] = { element: __classPrivateFieldGet(this, _XRouter_cache, "f") ? element : null, name };
                }
                if (__classPrivateFieldGet(this, _XRouter_before, "f"))
                    yield __classPrivateFieldGet(this, _XRouter_before, "f").call(this, location, element);
                if (!__classPrivateFieldGet(this, _XRouter_dynamic, "f")) {
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
                while (__classPrivateFieldGet(this, _XRouter_target, "f").firstChild) {
                    __classPrivateFieldGet(this, _XRouter_target, "f").removeChild(__classPrivateFieldGet(this, _XRouter_target, "f").firstChild);
                }
                if (__classPrivateFieldGet(this, _XRouter_after, "f")) {
                    element.removeEventListener('afterconnected', __classPrivateFieldGet(this, _XRouter_data, "f")[location.pathname].after);
                    const after = __classPrivateFieldGet(this, _XRouter_after, "f").bind(__classPrivateFieldGet(this, _XRouter_after, "f"), location, element);
                    __classPrivateFieldGet(this, _XRouter_data, "f")[location.pathname].after = after;
                    element.addEventListener('afterconnected', after);
                }
                __classPrivateFieldGet(this, _XRouter_target, "f").appendChild(element);
                window.dispatchEvent(new CustomEvent('router', { detail: location }));
            });
        },
        _XRouter_state = function _XRouter_state(event) {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                yield this.replace(((_a = event.state) === null || _a === void 0 ? void 0 : _a.href) || window.location.href);
                window.scroll(((_b = event.state) === null || _b === void 0 ? void 0 : _b.top) || 0, 0);
            });
        },
        _XRouter_click = function _XRouter_click(event) {
            return __awaiter(this, void 0, void 0, function* () {
                if (event.target.type ||
                    event.button !== 0 ||
                    event.defaultPrevented ||
                    event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
                    return;
                let target = event.path ? event.path[0] : event.target;
                let parent = target.parentElement;
                if (__classPrivateFieldGet(this, _XRouter_contain, "f")) {
                    while (parent) {
                        if (parent.nodeName === __classPrivateFieldGet(this, _XRouter_target, "f").nodeName) {
                            break;
                        }
                        else {
                            parent = parent.parentElement;
                        }
                    }
                    if (parent.nodeName !== __classPrivateFieldGet(this, _XRouter_target, "f").nodeName) {
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
                if (__classPrivateFieldGet(this, _XRouter_external, "f") &&
                    (__classPrivateFieldGet(this, _XRouter_external, "f") instanceof RegExp && __classPrivateFieldGet(this, _XRouter_external, "f").test(target.href) ||
                        typeof __classPrivateFieldGet(this, _XRouter_external, "f") === 'function' && __classPrivateFieldGet(this, _XRouter_external, "f").call(this, target.href) ||
                        typeof __classPrivateFieldGet(this, _XRouter_external, "f") === 'string' && __classPrivateFieldGet(this, _XRouter_external, "f") === target.href))
                    return;
                event.preventDefault();
                this.assign(target.href);
            });
        },
        _a);

    var Fetcher = new class XFetcher {
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
                    }
                    else if (typeof context.body === 'object') {
                        context.body = JSON.stringify(context.body);
                    }
                }
                const result = yield window.fetch(context.url, context);
                Object.defineProperties(context, {
                    result: { enumerable: true, value: result },
                    code: { enumerable: true, value: result.status }
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

    var index = Object.freeze(new class Oxe {
        constructor() {
            this.XElement = XElement;
            this.Element = XElement;
            this.element = XElement;
            this.XFetcher = Fetcher;
            this.Fetcher = Fetcher;
            this.fetcher = Fetcher;
            this.XRouter = Router;
            this.Router = Router;
            this.router = Router;
        }
    });

    return index;

}));
