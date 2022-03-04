
/*!
    Name: oxe
    Version: 6.0.7
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

    var booleanTypes = [
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
    };
    const standardUnrender = function (binder) {
        const boolean = booleanTypes.includes(binder.name);
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
        const { owner } = binder;
        const { type } = owner;
        if (type === 'select-one') {
            const [option] = owner.selectedOptions;
            const value = option ? '$value' in option ? option.$value : option.value : undefined;
            binder.compute({ $event: event, $value: value, $assignment: true });
            // display = format(computed);
        }
        else if (type === 'select-multiple') {
            const value = [];
            for (const option of owner.selectedOptions) {
                value.push('$value' in option ? option.$value : option.value);
            }
            binder.compute({ $event: event, $value: value, $assignment: true });
            // display = format(computed);
        }
        else if (type === 'number' || type === 'range') {
            binder.compute({ $event: event, $value: owner.valueAsNumber, $assignment: true });
            // if (typeof computed === 'number' && computed !== Infinity) owner.valueAsNumber = computed;
            // else owner.value = computed;
            // owner.value = computed;
            // display = owner.value;
        }
        else if (dateTypes.includes(type)) {
            const value = typeof owner.$value === 'string' ? owner.value : stampFromView(owner.valueAsNumber);
            binder.compute({ $event: event, $value: value, $assignment: true });
            // if (typeof owner.$value === 'string') owner.value = computed;
            // else owner.valueAsNumber = stampToView(computed);
            // display = owner.value;
        }
        else {
            const value = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.value) : owner.value;
            const checked = '$value' in owner && parseable(owner.$value) ? JSON.parse(owner.checked) : owner.checked;
            binder.compute({ $event: event, $value: value, $checked: checked, $assignment: true });
            // display = format(computed);
            // owner.value = display;
        }
        // owner.$value = computed;
        // if (type === 'checked' || type === 'radio') owner.$checked = computed;
        // owner.setAttribute('value', display);
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
                option.selected = computed?.includes(optionValue);
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
        const [data, variable, index, key] = binder.compute();
        const [reference] = binder.references;
        binder.meta.data = data;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        if (!binder.meta.setup) {
            binder.node.value = '';
            // binder.meta.variableNamePattern = new RegExp(`([^.a-zA-Z0-9$_\\[\\]])(${variable})\\b`);
            // binder.meta.variableNamePattern = new RegExp(`^${variable}\\b`);
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
        if (data?.constructor === Array) {
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
                const $key = binder.meta.keys[binder.meta.currentLength] ?? binder.meta.currentLength;
                const $index = binder.meta.currentLength++;
                const context = new Proxy(binder.context, {
                    has: eachHas.bind(null, binder, $index, $key),
                    get: eachGet.bind(null, binder, $index, $key),
                    set: eachSet.bind(null, binder, $index, $key),
                });
                // const variableValue = `${binder.meta.path}.${binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength}`;
                // const rewrites = binder.rewrites?.slice() || [];
                // if (binder.meta.keyName) rewrites.unshift([ binder.meta.keyName, keyValue ]);
                // // if (binder.meta.indexName) rewrites.unshift([ binder.meta.indexName, indexValue ]);
                // // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableName, variableValue ]);
                // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableNamePattern, variableValue ]);
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
                    // binder.binder.add(node, binder.container, binder.context, rewrites, descriptors);
                    node = node.nextSibling;
                }
                binder.meta.queueElement.content.appendChild(clone);
                // var d = document.createElement('div');
                // d.classList.add('box');
                // // var t = document.createTextNode(index);
                // var t = document.createTextNode('{{item.number}}');
                // binder.binder.add(t, binder.container, binder.context, rewrites, descriptors);
                // d.appendChild(t);
                // binder.meta.queueElement.content.appendChild(d);
            }
            console.timeEnd('each while');
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            binder.owner.appendChild(binder.meta.queueElement.content);
        }
        // if (binder.owner.nodeName === 'SELECT') {
        //     binder.binder.nodeBinders.get(binder.owner.attributes[ 'value' ])?.render();
        // }
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
        event.preventDefault();
        const form = {};
        const target = event.target;
        // const elements = target?.elements || target?.form?.elements;
        const elements = (target?.form || target)?.querySelectorAll('[name]');
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
        event.preventDefault();
        const target = event.target;
        // const elements = target?.elements || target?.form?.elements;
        const elements = (target?.form || target)?.querySelectorAll('[name]');
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

    // const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
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
    const parser = function (data) {
        // data = data.replace(normalizeReference, '.$2');
        // if (rewrites) {
        //     for (const [ name, value ] of rewrites) {
        //         data = data.replace(name, `$1${value}`);
        //     }
        // }
        const cached = cache.get(data);
        if (cached)
            return cached;
        // console.log('not cached pareser');
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

    // import Observer from './observer';
    const TN = Node.TEXT_NODE;
    const EN = Node.ELEMENT_NODE;
    const tick = Promise.resolve();
    const scopeGet = function (event, reference, target, key, receiver) {
        if (key === 'x')
            return { reference };
        const value = Reflect.get(target, key, receiver);
        if (value && typeof value === 'object') {
            reference = reference ? `${reference}.${key}` : `${key}`;
            return new Proxy(value, {
                get: scopeGet.bind(null, event, reference),
                set: scopeSet.bind(null, event, reference),
                deleteProperty: scopeDelete.bind(null, event, reference)
            });
        }
        return value;
    };
    const scopeDelete = function (event, reference, target, key) {
        if (target instanceof Array) {
            target.splice(key, 1);
        }
        else {
            Reflect.deleteProperty(target, key);
        }
        tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'derender'));
        return true;
    };
    const scopeSet = function (event, reference, target, key, to, receiver) {
        const from = Reflect.get(target, key, receiver);
        if (key === 'length') {
            tick.then(event.bind(null, reference, 'render'));
            tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
            return true;
        }
        else if (from === to || isNaN(from) && to === isNaN(to)) {
            return true;
        }
        Reflect.set(target, key, to, receiver);
        tick.then(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    };
    const scopeEvent = function (data, reference, type) {
        const binders = data.get(reference);
        if (binders) {
            for (const binder of binders) {
                binder[type]();
            }
        }
    };
    const handlers = {
        on,
        text,
        html,
        each,
        value,
        checked,
        standard
    };
    const template = document.createElement('template');
    template.innerHTML = `<style>:host{display:block;}</style><slot></slot>`;
    class Component extends HTMLElement {
        static attributes;
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        #setup = false;
        prefix = 'o-';
        prefixEach = 'o-each';
        prefixValue = 'o-value';
        syntaxEnd = '}}';
        syntaxStart = '{{';
        syntaxLength = 2;
        binders = new Map();
        syntaxMatch = new RegExp('{{.*?}}');
        prefixReplace = new RegExp('^o-');
        syntaxReplace = new RegExp('{{|}}', 'g');
        data;
        root;
        html;
        adopt;
        shadow;
        handlers = handlers;
        template = document.createElement('template');
        // adopted: () => void;
        // rendered: () => void;
        // connected: () => void;
        // disconnected: () => void;
        // attributed: (name: string, from: string, to: string) => void;
        // #adopted: () => void;
        // #rendered: () => void;
        // #connected: () => void;
        // #disconnected: () => void;
        // #attributed: (name: string, from: string, to: string) => void;
        // #afterRenderEvent = new Event('afterrender');
        // #beforeRenderEvent = new Event('beforerender');
        // #afterConnectedEvent = new Event('afterconnected');
        // #beforeConnectedEvent = new Event('beforeconnected');
        static adopt = true;
        static html = () => '';
        static data = () => ({});
        static shadow = () => '<style>:host{display:block;}</style><slot></slot>';
        constructor() {
            super();
            // this.#adopted = (this as any).adopted;
            // this.#rendered = (this as any).rendered;
            // this.#connected = (this as any).connected;
            // this.#attributed = (this as any).attributed;
            // this.#disconnected = (this as any).disconnected;
            let node;
            const adopt = this.constructor?.adopt;
            const data = this.constructor?.data?.();
            const html = this.constructor?.html?.();
            const shadow = this.constructor?.shadow?.();
            this.adopt = adopt;
            this.shadow = this.attachShadow({ mode: 'open' });
            this.data = new Proxy(data, {
                get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
                set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
                deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
            });
            if (typeof shadow === 'string') {
                this.shadow.innerHTML = shadow;
                node = this.shadow.firstChild;
            }
            else {
                node = shadow?.firstChild;
            }
            while (node) {
                this.binds(node);
                node = node.nextSibling;
            }
            if (adopt) {
                node = this.firstChild;
                while (node) {
                    this.binds(node);
                    node = node.nextSibling;
                }
            }
            if (typeof html === 'string') {
                this.html = document.createElement('template');
                this.html.innerHTML = html;
                this.html = this.html.content;
                node = this.html.firstChild;
            }
            else {
                node = html.firstChild;
            }
            if (adopt) {
                while (node) {
                    this.binds(node);
                    node = node.nextSibling;
                }
            }
        }
        // get (data: any) {
        //     if (typeof data === 'string') {
        //         return this.pathBinders.get(data);
        //     } else {
        //         return this.nodeBinders.get(data);
        //     }
        // }
        unbind(node) {
            const binders = this.binders.get(node);
            if (!binders)
                return;
            for (const binder of binders) {
                for (const reference of binder.references) {
                    this.binders.get(reference)?.delete(binder);
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
            context = context ?? this.data;
            const binder = {
                meta: {},
                binder: this,
                render: undefined,
                compute: undefined,
                unrender: undefined,
                references: undefined,
                rewrites: rewrites ?? [],
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
            if (node.nodeType === TN) {
                this.unbind(node);
            }
            else if (node.nodeType === EN) {
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
            if (node.nodeType === TN) {
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
                    this.binds(split, context, rewrites);
                }
                this.bind(node, 'text', node.nodeValue, node, context, rewrites);
            }
            else if (node.nodeType === EN) {
                const attributes = node.attributes;
                const inherit = attributes['inherit'];
                if (inherit)
                    this.bind(inherit, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);
                const each = attributes['each'];
                if (each)
                    this.bind(each, each.name, each.value, each.ownerElement, context, rewrites);
                if (!each && !inherit) {
                    let child = node.firstChild;
                    if (child) {
                        do
                            this.binds(child, context, rewrites);
                        while (child = child.nextSibling);
                    }
                }
                if (attributes.length) {
                    for (const attribute of attributes) {
                        if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.syntaxMatch.test(attribute.value)) {
                            this.bind(attribute, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                        }
                    }
                }
            }
        }
        // #render () {
        //     this.data = Observer(
        //         typeof this.data === 'function' ? this.data() : this.data,
        //         this.#observe.bind(this)
        //     );
        //     if (this.adopt) {
        //         let child = this.firstChild;
        //         while (child) {
        //             this.#binder.add(child, this, this.data);
        //             child = child.nextSibling;
        //         }
        //     }
        //     const template = document.createElement('template');
        //     template.innerHTML = this.html;
        //     if (
        //         !this.shadow ||
        //         !('attachShadow' in document.body) &&
        //         !('createShadowRoot' in document.body)
        //     ) {
        //         const templateSlots = template.content.querySelectorAll('slot[name]');
        //         const defaultSlot = template.content.querySelector('slot:not([name])');
        //         for (let i = 0; i < templateSlots.length; i++) {
        //             const templateSlot = templateSlots[ i ];
        //             const name = templateSlot.getAttribute('name');
        //             const instanceSlot = this.querySelector('[slot="' + name + '"]');
        //             if (instanceSlot) templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
        //             else templateSlot.parentNode.removeChild(templateSlot);
        //         }
        //         if (this.children.length) {
        //             while (this.firstChild) {
        //                 if (defaultSlot) defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
        //                 else this.removeChild(this.firstChild);
        //             }
        //         }
        //         if (defaultSlot) defaultSlot.parentNode.removeChild(defaultSlot);
        //     }
        //     let child = template.content.firstChild;
        //     while (child) {
        //         this.#binder.add(child, this, this.data);
        //         child = child.nextSibling;
        //     }
        //     this.#root.appendChild(template.content);
        // }
        // attributeChangedCallback (name: string, from: string, to: string) {
        //     this.#attributed(name, from, to);
        // }
        // adoptedCallback () {
        //     if (this.#adopted) this.#adopted();
        // }
        // disconnectedCallback () {
        //     if (this.#disconnected) this.#disconnected();
        // }
        connectedCallback() {
            if (this.#setup)
                return;
            else
                this.#setup = true;
            if (this.html) {
                this.appendChild(this.html);
                this.html = this;
            }
            //     let data;
            //     if (this.data) data = this.data;
            //     // if (this.data) data = this.data();
            //     let render;
            //     if (this.html) render = this.html;
            //     console.log(this.html);
            //     // if (this.render) render = this.render();
            //     if (data instanceof Promise || render instanceof Promise) {
            //         return Promise.all([ data, render ]).then(function connectedCallbackPromise ([ data, render ]) {
            //             this.data = new Proxy(data ?? {}, {
            //                 get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
            //                 set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
            //                 deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
            //             });
            //             if (render) this.template.innerHTML = render;
            //             let adoptNode = this.firstChild;
            //             while (adoptNode) {
            //                 this.binds(adoptNode);
            //                 adoptNode = adoptNode.nextSibling;
            //             }
            //             let templateNode = this.template.content.firstChild;
            //             while (templateNode) {
            //                 this.binds(templateNode);
            //                 templateNode = templateNode.nextSibling;
            //             }
            //             this.appendChild(this.template.content);
            //         });
            //     } else {
            //         this.data = new Proxy(data ?? {}, {
            //             get: scopeGet.bind(null, scopeEvent.bind(null, this.binders), ''),
            //             set: scopeSet.bind(null, scopeEvent.bind(null, this.binders), ''),
            //             deleteProperty: scopeDelete.bind(null, scopeEvent.bind(null, this.binders), '')
            //         });
            //         if (render) this.template.innerHTML = render;
            //         let adoptNode = this.firstChild;
            //         while (adoptNode) {
            //             this.binds(adoptNode);
            //             adoptNode = adoptNode.nextSibling;
            //         }
            //         let templateNode = this.template.content.firstChild;
            //         while (templateNode) {
            //             this.binds(templateNode);
            //             templateNode = templateNode.nextSibling;
            //         }
            //         this.appendChild(this.template.content);
            //     }
            //     // if (!this.#flag) {
            //     //     this.#flag = true;
            //     //     this.dispatchEvent(this.#beforeRenderEvent);
            //     //     this.#render();
            //     //     if (this.#rendered) this.#rendered();
            //     //     this.dispatchEvent(this.#afterRenderEvent);
            //     //     this.#ready = true;
            //     //     this.dispatchEvent(this.#readyEvent);
            //     // }
            //     // this.dispatchEvent(this.#beforeConnectedEvent);
            //     // if (this.#connected) this.#connected();
            //     // this.dispatchEvent(this.#afterConnectedEvent);
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

    // declare global {
    //     interface Window {
    //         LOAD: any;
    //         MODULES: any;
    //         REGULAR: any;
    //         REGULAR_SUPPORT: any;
    //         DYNAMIC_SUPPORT: any;
    //     }
    // }
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
        #cache = true;
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
            if ('cache' in option)
                this.#cache = option.cache;
            // if ('beforeConnected' in option) this.#beforeConnected = option.beforeConnected;
            // if ('afterConnected' in option) this.#afterConnected = option.afterConnected;
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
            let element;
            if (location.pathname in this.#data) {
                const route = this.#data[location.pathname];
                element = this.#cache ? route.element : window.document.createElement(route.name);
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
                this.#data[location.pathname] = { element: this.#cache ? element : null, name };
            }
            if (this.#before)
                await this.#before(location, element);
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
            if (this.#after) {
                element.removeEventListener('afterconnected', this.#data[location.pathname].after);
                const after = this.#after.bind(this.#after, location, element);
                this.#data[location.pathname].after = after;
                element.addEventListener('afterconnected', after);
            }
            this.#target.appendChild(element);
            window.dispatchEvent(new CustomEvent('router', { detail: location }));
        }
        async #state(event) {
            await this.replace(event.state?.href || window.location.href);
            window.scroll(event.state?.top || 0, 0);
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
            if (!item)
                return;
            item.count--;
            if (item.count === 1) {
                this.#data.delete(name);
                this.#style.removeChild(item.node);
            }
        }
        attach(name, text) {
            let item = this.#data.get(name);
            if (item) {
                item.count++;
            }
            else {
                item = { count: 1, node: this.node(name, text) };
                this.#data.set(name, item);
                this.#style.appendChild(item.node);
            }
        }
        node(name, text) {
            return document.createTextNode(this.scope(name, this.transform(text)));
        }
    };

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

}));
