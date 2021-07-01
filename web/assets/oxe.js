
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

    // const run = async function (tasks: tasks) {
    //     let task;
    //     while (task = tasks.shift()) {
    //         task();
    //         // await task();
    //     }
    // };
    const set = function (task, tasks, path, target, property, value) {
        if (property === 'length') {
            return true;
        }
        else if (target[property] === value || `${target[property]}${value}` === 'NaNNaN') {
            return true;
        }
        // let initial;
        // if (!tasks.length) {
        //     initial = () => { };
        //     tasks.push(initial);
        // }
        if (target?.constructor === Array) {
            target[property] = observer(value, task, tasks, path ? `${path}[${property}]` : property);
        }
        else {
            target[property] = observer(value, task, tasks, path ? `${path}.${property}` : property);
        }
        Promise.resolve().then(task.bind(null, path));
        // if (path) tasks.push(task.bind(null, path, length));
        // if (tasks[ 0 ] === initial) run(tasks);
        return true;
    };
    const observer = function (source, task, tasks = [], path = '') {
        let target;
        // let initial;
        // if (!tasks.length) {
        //     initial = () => { };
        //     tasks.push(initial);
        // }
        if (source?.constructor === Array) {
            target = source;
            for (let key = 0; key < source.length; key++) {
                target[key] = observer(source[key], task, tasks, path ? `${path}[${key}]` : `${key}`);
            }
            target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
        }
        else if (source?.constructor === Object) {
            target = source;
            for (let key in source) {
                target[key] = observer(source[key], task, tasks, path ? `${path}.${key}` : key);
            }
            target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
        }
        else {
            target = source;
        }
        Promise.resolve().then(task.bind(null, path));
        // if (path) tasks.push(task.bind(null, path));
        // if (tasks[ 0 ] === initial) run(tasks);
        return target;
    };

    const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
    const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
    const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
    const replaceOutsideAndSyntax = /[^{}]*{{|}}[^{}]*/g;
    const reference = '([a-zA-Z_$\\[\\]][a-zA-Z_$0-9]*|\\s*("|`|\'|{|}|\\?\\s*\\.|\\.|\\[|\\])\\s*)';
    const references = new RegExp(`${reference}+(?!.*\\1)`, 'g');
    const matchAssignment = /([a-zA-Z0-9$_.'`"\[\]]+)\s*=([^=]+|$)/;
    const strips = new RegExp([
        ';|:',
        '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`',
        `(window|document|this|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${reference}*`,
        `\\btrue\\b|\\bfalse\\b|\\bnull\\b|\\bundefined\\b|\\bNaN\\b|\\bof\\b|\\bin\\b|
    \\bdo\\b|\\bif\\b|\\bfor\\b|\\blet\\b|\\bnew\\b|\\btry\\b|\\bvar\\b|\\bcase\\b|\\belse\\b|\\bwith\\b|\\bawait\\b|
    \\bbreak\\b|\\bcatch\\b|\\bclass\\b|\\bconst\\b|\\bsuper\\b|\\bthrow\\b|\\bwhile\\b|\\byield\\b|\\bdelete\\b|
    \\bexport\\b|\\bimport\\b|\\breturn\\b|\\bswitch\\b|\\bdefault\\b|\\bextends\\b|\\bfinally\\b|\\bcontinue\\b|
    \\bdebugger\\b|\\bfunction\\b|\\barguments\\b|\\btypeof\\b|\\bvoid\\b`,
    ].join('|').replace(/\s|\t|\n/g, ''), 'g');
    const traverse = function (data, path, paths) {
        paths = paths || path.replace(/\.?\s*\[(.*?)\]/g, '.$1').split('.');
        if (!paths.length) {
            return data;
        }
        else {
            let part = paths.shift();
            const conditional = part.endsWith('?');
            if (conditional && typeof data !== 'object')
                return undefined;
            part = conditional ? part.slice(0, -1) : part;
            return traverse(data[part], path, paths);
        }
    };
    function Statement (statement, data, extra) {
        statement = isOfIn.test(statement) ? statement.replace(replaceOfIn, '{{$2}}') : statement;
        if (extra) {
            if (extra.keyName)
                statement = statement.replace(extra.keyName, (s, g1, g2, g3) => g1 + extra.keyValue + g3);
            if (extra.indexName)
                statement = statement.replace(extra.indexName, (s, g1, g2, g3) => g1 + extra.indexValue + g3);
            if (extra.variableName)
                statement = statement.replace(extra.variableName, (s, g1, g2, g3) => g1 + extra.variableValue + g3);
        }
        const convert = !shouldNotConvert.test(statement);
        let striped = statement.replace(replaceOutsideAndSyntax, ' ').replace(strips, '');
        const paths = striped.match(references) || [];
        let [, assignment] = striped.match(matchAssignment) || [];
        assignment = assignment?.replace(/\s/g, '');
        // assignment = assignment ? `with ($context) { return (${assignment}); }` : undefined;
        // const assignee = assignment ? () => new Function('$context', assignment)(data) : () => undefined;
        const assignee = assignment ? traverse.bind(null, data, assignment) : () => undefined;
        const context = new Proxy(data, {
            // has: () => true,
            // get: (target, name) => name in data ? data[ name ] : name in target ? target[ name ] : name in window ? window[ name ] : undefined,
            get: (target, name) => name in data ? data[name] : name in window ? window[name] : undefined,
            has: (target, property) => typeof property === 'string' && ['$f', '$e', '$v', '$c', '$form', '$event', '$value', '$checked'].includes(property) ? false : true
        });
        let code = statement;
        code = code.replace(/{{/g, convert ? `' +` : '');
        code = code.replace(/}}/g, convert ? ` + '` : '');
        code = convert ? `'${code}'` : code;
        code = `
        var $f, $form, $e, $event, $v, $value, $c, $checked;
        if ($extra) {
            $f = $extra.form, $form = $extra.form,
            $e = $extra.event, $event = $extra.event,
            $v = $extra.value, $value = $extra.value,
            $c = $extra.checked, $checked = $extra.checked;
        }
        with ($context) {
            return (${code});
        }
    `;
        const compute = async function generateCompute() {
            return new Function('$context', '$extra', code).bind(null, context);
        }();
        // const compute = new Function('$context', '$extra', code).bind(null, context);
        // const compute = new Function('$context', '$extra', code).bind(null, context);
        // const compute = function () {
        //     return new Function('$context', '$extra', code).bind(null, context);
        // };
        return { compute, assignee, paths, code, context };
    }
    //     'true', 'false', 'null', 'undefined', 'NaN', 'of', 'in',
    //     'do', 'if', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'with', 'await',
    //     'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete',
    //     'export', 'import', 'return', 'switch', 'default', 'extends', 'finally', 'continue',
    //     'debugger', 'function', 'arguments', 'typeof', 'void'
    // const $string = 'string';
    // const $number = 'number';
    // const $variable = 'variable';
    // const $function = 'function';
    // type Node = {
    //     type?: string,
    //     parent?: Node,
    //     value?: string,
    //     children?: any[],
    //     compute?: () => any,
    // };
    // const set = function (path: string, data: object, value: any) {
    //     const keys = path.split(/\.|\[|\]/);
    //     const l = keys.length;
    //     for (let i = 0; i < l; i++) {
    //         const key = keys[ i ];
    //         const next = keys[ i + 1 ];
    //         if (next) {
    //             if (!(key in data)) {
    //                 data[ key ] = /[0-9]+/.test(next) ? [] : {};
    //             }
    //             data = data[ key ];
    //         } else {
    //             return data[ key ] = value;
    //         }
    //     }
    // };
    // const get = function (data: object, path: string | string[]) {
    //     const keys = typeof path === 'string' ? path.split(/\.|\[|\]/) : path;
    //     if (!keys.length) {
    //         return data;
    //     } else if (typeof data !== 'object') {
    //         return undefined;
    //     } else {
    //         return get(data[ keys[ 0 ] ], keys.slice(1));
    //     }
    // };
    // const finish = function (node, data, tree, assignment?: string) {
    //     if (node.type !== $string) node.value = node.value.replace(/\s*/g, '');
    //     if (node.value === 'NaN') {
    //         node.type = 'nan';
    //         node.compute = () => NaN;
    //     } else if (node.value === 'null') {
    //         node.type = 'null';
    //         node.compute = () => null;
    //     } else if (node.value === 'true') {
    //         node.type = 'boolean';
    //         node.compute = () => true;
    //     } else if (node.value === 'false') {
    //         node.type = 'boolean';
    //         node.compute = () => false;
    //     } else if (node.value === 'undefined') {
    //         node.type = 'undefined';
    //         node.compute = () => undefined;
    //     } else if (node.type === $number) {
    //         node.compute = () => Number(node.value);
    //     } else if (node.type === $string) {
    //         node.compute = () => node.value;
    //     } else if (node.type === $function) {
    //         console.log('push', node.value);
    //         tree.paths.push(node.value);
    //         node.compute = (context, ...args) => {
    //             if (assignment) {
    //                 return set(assignment, data, get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args)));
    //             } else {
    //                 return get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args));
    //             }
    //         };
    //     } else {
    //         console.log(node.value);
    //         node.type = $variable;
    //         tree.paths.push(node.value);
    //         node.compute = (alternate) => {
    //             return node.value.startsWith('$e') || node.value.startsWith('$event')
    //                 || node.value.startsWith('$v') || node.value.startsWith('$value')
    //                 ? get(alternate, node.value) : get(data, node.value);
    //         };
    //         // node.compute = (value) => {
    //         //     return value === undefined ? get(data, node.value) : value;
    //         // };
    //     }
    // };
    // const assignmentPattern = /{{((\w+\s*(\.|\[|\])?\s*)+)=.+}}/;
    // export default function expression (expression, data) {
    //     const tree = { type: 'tree', children: [], paths: [], value: null, parent: null, compute: null };
    //     let inside = false;
    //     let node: Node = { value: '', parent: tree, children: [] };
    //     // each of/in fix
    //     expression = expression.replace(/{{.*\s+(of|in)\s+/, '{{');
    //     // assignment handle
    //     let assignment;
    //     if (expression.includes('=')) {
    //         assignment = expression.replace(assignmentPattern, '$1').replace(/\s*/g, '');
    //         console.log(assignment);
    //         expression = expression.replace(/{{.*?=/, '{{');
    //     }
    //     for (let i = 0; i < expression.length; i++) {
    //         const c = expression[ i ];
    //         const next = expression[ i + 1 ];
    //         const previous = expression[ i - 1 ];
    //         if (
    //             inside === false &&
    //             c === '{' && next === '{'
    //         ) {
    //             i++;
    //             if (node.value) {
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //             }
    //             inside = true;
    //             node = { value: '', parent: node.parent };
    //         } else if (
    //             inside === true &&
    //             c === '}' && next === '}'
    //         ) {
    //             i++;
    //             if (node.value) {
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //             }
    //             inside = false;
    //             node = { value: '', parent: node.parent };
    //         } else if (inside === false) {
    //             node.value += c;
    //             node.type = $string;
    //         } else if (/'|`| "/.test(c) && !node.type || node.type === $string) {;;
    //             node.type = $string;
    //             node.value += c;
    //             if (node.value.length > 1 && node.value[ 0 ] === c && previous !== '\\') {
    //                 node.value = node.value.slice(1, -1);
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //                 node = { value: '', parent: node.parent };
    //             }
    //         } else if (/[0-9.]/.test(c) && !node.type || node.type === $number) {
    //             node.type = $number;
    //             node.value += c;
    //             if (!/[0-9.]/.test(next)) {
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //                 node = { value: '', parent: node.parent };
    //             }
    //         } else if (',' === c) {
    //             if (node.value) {
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //                 node = { value: '', parent: node.parent };
    //             }
    //         } else if ('(' === c) {
    //             node.children = [];
    //             node.type = $function;
    //             finish(node, data, tree, assignment);
    //             node.parent.children.push(node);
    //             node = { value: '', parent: node };
    //         } else if (')' === c) {
    //             if (node.value) {
    //                 finish(node, data, tree);
    //                 node.parent.children.push(node);
    //             }
    //             node = { value: '', parent: node.parent.parent };
    //         } else if (/\s/.test(c)) {
    //             continue;
    //         } else if (/[a-zA-Z$_]/.test(c) && !node.type || node.type === $variable) {
    //             node.type = $variable;
    //             node.value += c;
    //         } else {
    //             node.value += c;
    //         }
    //     }
    //     if (node.type) {
    //         node.compute = function (value) { return value; }.bind(null, node.value);
    //         tree.children.push(node);
    //     }
    //     if (tree.children.length === 1) {
    //         tree.compute = (...args) => tree.children[ 0 ].compute(...args);
    //     } else {
    //         tree.compute = (...args) => tree.children.map(child => child.compute(...args)).join('');
    //     }
    //     return tree;
    // };
    // start: test
    // const m = {
    //     n1: 1,
    //     n: { n2: 2 },
    //     w: 'world',
    //     foo: 'sFoo',
    //     bar: 'sBar',
    //     one: (two, oneDotTwo, blue) => `sOne ${two} ${oneDotTwo + 2} ${blue}`,
    //     two: (foo, three) => `sTwo ${foo} ${three}`,
    //     three: (bar, helloWorld) => `sThree ${bar} ${helloWorld + 's'}`,
    // };
    // console.log(expression(`hello {{w}}.`, m)());
    // console.log(expression(`{{n1}}`, m)());
    // console.log(expression(`{{n.n2}}`, m)());
    // console.log(expression(`{{one(two(foo, three(bar, 'hello world')), 1.2)}}`, m)('blue'));
    //end: test

    const format = (data) => data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;

    const booleans = [
        'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
        'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
        'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
        'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
        'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
    ];
    const standard = async function (binder) {
        const { name, owner, node } = binder;
        let data = await binder.compute();
        const boolean = booleans.includes(name);
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
        binder.busy = true;
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
        binder.busy = false;
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
                        const radioBinders = binder.get(radio.getAttributeNode('checked'));
                        if (radioBinders) {
                            for (const [, radioBinder] of radioBinders) {
                                radioBinder.busy = true;
                                await radioBinder.compute({ checked: radio.checked, value: radio.value });
                                radioBinder.busy = false;
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

    const numberTypes = ['date', 'datetime-local', 'month', 'number', 'range', 'time', 'week'];
    const input = async function (binder, event) {
        binder.busy = true;
        const { owner } = binder;
        const { type } = owner;
        let display, computed;
        if (type === 'select-one') {
            const [option] = owner.selectedOptions;
            const value = option?.value;
            computed = await binder.compute({ event, value });
            display = format(computed);
        }
        else if (type === 'select-multiple') {
            const value = [];
            for (const option of owner.selectedOptions) {
                value.push(option.value);
            }
            computed = await binder.compute({ event, value });
            display = format(computed);
            // } else if (type === 'file') {
            //     const { multiple, files } = owner;
            //     const value = multiple ? [ ...files ] : files[ 0 ];
            //     const computed = await binder.compute({ event, value });
            //     display = format(computed);
        }
        else {
            const { checked } = owner;
            const isNumber = owner.$typeof !== 'string' && numberTypes.includes(type);
            const value = isNumber ? owner.valueAsNumber : owner.value;
            computed = await binder.compute({ event, value, checked });
            display = format(computed);
            if (numberTypes.includes(type) && typeof computed !== 'string') {
                owner.valueAsNumber = computed;
            }
            else {
                owner.value = display;
            }
        }
        owner.$value = computed;
        owner.$typeof = typeof computed;
        owner.setAttribute('value', display);
        binder.busy = false;
    };
    const value = async function value(binder) {
        const { owner, meta } = binder;
        const { type } = owner;
        if (!meta.setup) {
            meta.setup = true;
            binder.owner.addEventListener('$render', () => binder.render());
            binder.owner.addEventListener('input', event => input(binder, event));
        }
        let display, computed;
        if (type === 'select-one') {
            // if (!context.options.length) return;
            const value = binder.assignee();
            for (const option of owner.options) {
                // for (const option of context.options) {
                if (option.selected = option.value === value)
                    break;
            }
            computed = await binder.compute({ value: value });
            display = format(computed);
            owner.value = display;
        }
        else if (type === 'select-multiple') {
            const value = binder.assignee();
            const { options } = owner;
            for (const option of options) {
                option.selected = value?.includes(option.value);
            }
            computed = await binder.compute({ value });
            display = format(computed);
        }
        else {
            const { checked } = owner;
            const value = binder.assignee();
            computed = await binder.compute({ value, checked });
            display = format(computed);
            if (numberTypes.includes(type) && typeof computed !== 'string') {
                owner.valueAsNumber = computed;
            }
            else {
                owner.value = display;
            }
        }
        owner.$value = computed;
        owner.$typeof = typeof computed;
        owner.setAttribute('value', display);
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

    const empty = /\s+|(\\t)+|(\\r)+|(\\n)+|^$/;
    const clean = function (node) {
        for (const child of node.childNodes) {
            clean(child);
        }
        if (node.nodeType === 8 || node.nodeType === 3 && empty.test(node.nodeValue)) {
            node.parentNode.removeChild(node);
            return false;
        }
        else {
            return true;
        }
    };
    const setup = function (binder) {
        const { meta, owner } = binder;
        const [variable, index, key] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();
        meta.keyName = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
        meta.indexName = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
        meta.variableName = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;
        meta.keys = [];
        meta.setup = true;
        meta.targetLength = 0;
        meta.currentLength = 0;
        meta.templateLength = 0;
        meta.clone = document.createElement('template');
        meta.templateElement = document.createElement('template');
        let node;
        while (node = owner.firstChild) {
            if (clean(node)) {
                meta.templateLength++;
                meta.clone.content.appendChild(node);
            }
        }
    };
    const each = async function each(binder) {
        const { meta, owner } = binder;
        if (!meta.setup)
            await setup(binder);
        let data = await binder.compute();
        // console.log('each', data.length, meta.targetLength);
        if (data instanceof Array) {
            meta.targetLength = data.length;
        }
        else {
            meta.keys = Object.keys(data || {});
            meta.targetLength = meta.keys.length;
        }
        if (meta.currentLength > meta.targetLength) {
            const tasks = [];
            while (meta.currentLength > meta.targetLength) {
                let count = meta.templateLength;
                while (count--) {
                    const node = owner.lastChild;
                    owner.removeChild(node);
                    tasks.push(binder.remove(node));
                }
                meta.currentLength--;
            }
            if (meta.currentLength === meta.targetLength) {
                Promise.all(tasks).then(function eachFinish() {
                    owner.appendChild(meta.templateElement.content);
                    if (owner.nodeName === 'SELECT')
                        owner.dispatchEvent(new Event('$render'));
                });
            }
        }
        else if (meta.currentLength < meta.targetLength) {
            const tasks = [];
            while (meta.currentLength < meta.targetLength) {
                const indexValue = meta.currentLength;
                const keyValue = meta.keys[indexValue] ?? indexValue;
                const variableValue = `${binder.path}[${keyValue}]`;
                const keyName = meta.keyName;
                const indexName = meta.indexName;
                const variableName = meta.variableName;
                meta.currentLength++;
                const extra = { keyName, indexName, variableName, indexValue, keyValue, variableValue };
                const clone = meta.clone.content.cloneNode(true);
                // binder.adds(clone.childNodes, binder.container, extra);
                // tasks.push(binder.adds(clone.childNodes, binder.container, extra));
                tasks.push(binder.adds(clone, binder.container, extra));
                meta.templateElement.content.appendChild(clone);
            }
            if (meta.currentLength === meta.targetLength) {
                Promise.all(tasks).then(function eachFinish() {
                    owner.appendChild(meta.templateElement.content);
                    if (owner.nodeName === 'SELECT')
                        owner.dispatchEvent(new Event('$render'));
                });
            }
        }
    };
    // export default { setup, write };

    const html = async function (binder) {
        let data = await binder.compute();
        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }
        while (binder.owner.firstChild) {
            const node = binder.owner.removeChild(binder.owner.firstChild);
            binder.remove(node);
        }
        const template = document.createElement('template');
        template.innerHTML = data;
        await Promise.all(Array.prototype.map.call(template.content.childNodes, async (node) => binder.add(node, binder.container, true))).then(() => binder.owner.appendChild(template.content));
    };

    const text = async function text(binder) {
        let data = await binder.compute();
        data = format(data);
        if (data === binder.owner.textContent)
            return;
        binder.owner.textContent = data;
    };
    // const write = async function (binder) {
    //     let data = await binder.compute();
    //     data = format(data);
    //     if (data === binder.owner.textContent) return;
    //     binder.owner.textContent = data;
    // };
    // export default { write };

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
                value = element.$value === 'object' ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
            }
            else if (type === 'select-multiple') {
                value = [];
                for (const option of element.selectedOptions) {
                    value.push('$value' in option ? option.$value === 'object' ? JSON.parse(JSON.stringify(option.$value)) : option.$value : option.value);
                }
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

    const TN = Node.TEXT_NODE;
    const EN = Node.ELEMENT_NODE;
    const AN = Node.ATTRIBUTE_NODE;
    const emptyAttribute = /\s*{{\s*}}\s*/;
    const emptyText = /\s+|(\\t)+|(\\r)+|(\\n)+|\s*{{\s*}}\s*|^$/;
    var Binder = new class Binder {
        constructor() {
            this.prefix = 'o-';
            this.syntaxEnd = '}}';
            this.syntaxStart = '{{';
            this.syntaxMatch = new RegExp('{{.*?}}');
            this.prefixReplace = new RegExp('^o-');
            this.syntaxReplace = new RegExp('{{|}}', 'g');
            // data: Map<Node, any> = new Map();
            this.nodeBinders = new Map();
            this.pathBinders = new Map();
            this.binders = {
                checked,
                standard,
                value,
                each,
                html,
                text,
                on,
            };
        }
        async setup(options = {}) {
            const { binders } = options;
            for (const name in binders) {
                if (name in this.binders === false) {
                    this.binders[name] = binders[name];
                }
            }
        }
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
        async bind(node, name, value, container, extra) {
            const { compute, assignee, paths } = Statement(value, container.data, extra);
            if (!paths.length)
                paths.push('');
            const owner = node.nodeType === AN ? node.ownerElement : node;
            const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
            const render = this.binders[type];
            const tasks = [];
            for (const path of paths) {
                const binder = {
                    render,
                    meta: {},
                    node, owner,
                    busy: false,
                    container, type,
                    assignee,
                    name, value, paths, path,
                    get: this.get.bind(this),
                    add: this.add.bind(this),
                    adds: this.adds.bind(this),
                    remove: this.remove.bind(this),
                    compute: async function cacheCompute(...args) {
                        this.compute = (await compute);
                        return this.compute(...args);
                    }
                };
                binder.render = render.bind(render, binder);
                if (path) {
                    if (!this.nodeBinders.has(node))
                        this.nodeBinders.set(node, new Map());
                    if (!this.pathBinders.has(path))
                        this.pathBinders.set(path, new Map());
                    this.nodeBinders.get(node).set(path, binder);
                    this.pathBinders.get(path).set(node, binder);
                }
                tasks.push(binder.render());
            }
            return Promise.all(tasks);
        }
        ;
        async remove(node) {
            const type = node.nodeType;
            if (type === EN) {
                const attributes = node.attributes;
                for (const attribute of attributes) {
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
        async adds(node, container, extra) {
            const tasks = [];
            node = node.firstChild;
            if (!node)
                return;
            tasks.push(this.add(node, container, extra));
            while (node = node.nextSibling) {
                tasks.push(this.add(node, container, extra));
            }
            return Promise.all(tasks);
        }
        async add(node, container, extra) {
            const type = node.nodeType;
            const tasks = [];
            if (type === TN) {
                if (emptyText.test(node.textContent))
                    return;
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
                    const value = node.textContent;
                    node.textContent = '';
                    // if (!empty.test(value))
                    tasks.push(this.bind(node, 'text', value, container, extra));
                    tasks.push(this.add(split, container, extra));
                }
                else {
                    const value = node.textContent;
                    node.textContent = '';
                    // if (!empty.test(value))
                    tasks.push(this.bind(node, 'text', value, container, extra));
                }
            }
            else if (type === EN) {
                const attributes = node.attributes;
                let each;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    const { name, value } = attribute;
                    if (name === 'each' || name === `${this.prefix}each`)
                        each = true;
                    // this.syntaxMatch.test(name) || name.startsWith(this.prefix) 
                    if (this.syntaxMatch.test(value)) {
                        attribute.value = '';
                        if (!emptyAttribute.test(value))
                            tasks.push(this.bind(attribute, name, value, container, extra));
                    }
                }
                if (!each)
                    tasks.push(this.adds(node, container, extra));
            }
            return Promise.all(tasks);
        }
    };

    var Css = new class Css {
        constructor() {
            this.#data = new Map();
            this.#style = document.createElement('style');
            this.#support = !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)');
            this.#style.appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
            this.#style.setAttribute('title', 'oxe');
            document.head.appendChild(this.#style);
        }
        #data;
        #style;
        #support;
        scope(name, text) {
            return text
                .replace(/\t|\n\s*/g, '')
                .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
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

    class Component extends HTMLElement {
        constructor() {
            super();
            this.#flag = false;
            this.#name = this.nodeName.toLowerCase();
            // #adopted: () => void;
            // #rendered: () => void;
            // #connected: () => void;
            // #disconnected: () => void;
            // #attributed: (name: string, from: string, to: string) => void;
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
        static get observedAttributes() { return this.attributes; }
        static set observedAttributes(attributes) { this.attributes = attributes; }
        #root;
        #flag;
        #name;
        get root() { return this.#root; }
        get binder() { return Binder; }
        async render() {
            this.data = observer(this.data, async function observer(path) {
                // console.log(path);
                const binders = Binder.get(path);
                if (!binders)
                    return;
                // const tasks = [];
                for (const [, binder] of binders) {
                    // tasks.push(binder.render());
                    binder.render();
                }
                // return Promise.all(tasks);
            });
            if (this.adopt) {
                Binder.adds(this, this);
                // let child = this.firstChild;
                // while (child) {
                //     Binder.add(child, this);
                //     child = child.nextSibling;
                // }
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
            // const tasks = [];
            // let child = template.content.firstChild;
            // while (child) {
            //     tasks.push(Binder.add(child, this));
            //     child = child.nextSibling;
            // }
            Binder.adds(template.content, this);
            this.#root.appendChild(template.content);
            // return Promise.all(tasks);
        }
        async attributeChangedCallback(name, from, to) {
            await this.attributed(name, from, to);
        }
        async adoptedCallback() {
            if (this.adopted)
                await this.adopted();
        }
        async disconnectedCallback() {
            Css.detach(this.#name);
            if (this.disconnected)
                await this.disconnected();
        }
        async connectedCallback() {
            try {
                Css.attach(this.#name, this.css);
                if (this.#flag) {
                    if (this.connected)
                        await this.connected();
                }
                else {
                    this.#flag = true;
                    await this.render();
                    // if (this.rendered) await this.rendered();
                    if (this.connected)
                        await this.connected();
                }
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    // export default function decorate (target) {
    //     Object.defineProperties(target.prototype, {
    //         observedAttributes: {
    //             get () {
    //                 console.log('goa', target.attributes, this);
    //                 return target.attributes;
    //             },
    //             set (attributes) {
    //                 console.log('soa', attributes);
    //                 target.attributes = attributes;
    //             }
    //         },
    //         $name: { value: this.nodeName.toLowerCase() }
    //     });
    //     // #root: any;
    //     // #flag: boolean = false;
    //     // adopted: () => void;
    //     // rendered: () => void;
    //     // connected: () => void;
    //     // disconnected: () => void;
    //     // attributed: (name: string, from: string, to: string) => void;
    //     // css: string = '';
    //     // html: string = '';
    //     // data: object = {};
    //     // adopt: boolean = false;
    //     // shadow: boolean = false;
    //     // get root() { return this.#root; }
    //     // get binder() { return Binder; }
    //     // constructor() {
    //     //     super();
    //     //     if (this.shadow && 'attachShadow' in document.body) {
    //     //         this.#root = this.attachShadow({ mode: 'open' });
    //     //     } else if (this.shadow && 'createShadowRoot' in document.body) {
    //     //         this.#root = (this as any).createShadowRoot();
    //     //     } else {
    //     //         this.#root = this;
    //     //     }
    //     // }
    //     Object.defineProperties(target, {
    //         $render: {
    //             value: async function () {
    //                 if (this.shadow && 'attachShadow' in document.body) {
    //                     this.$root = this.attachShadow({ mode: 'open' });
    //                 } else if (this.shadow && 'createShadowRoot' in document.body) {
    //                     this.$root = (this as any).createShadowRoot();
    //                 } else {
    //                     this.$root = this;
    //                 }
    //                 this.data = Observer(this.data, async path => {
    //                     for (const [ , binder ] of Binder.data) {
    //                         if (binder.container === this && binder.path === path && !binder.busy) {
    //                             binder.busy = true;
    //                             await binder.render();
    //                             binder.busy = false;
    //                         }
    //                     }
    //                 });
    //                 if (this.adopt) {
    //                     let child = this.firstChild;
    //                     while (child) {
    //                         Binder.add(child, this);
    //                         child = child.nextSibling;
    //                     }
    //                 }
    //                 const template = document.createElement('template');
    //                 template.innerHTML = this.html;
    //                 // const clone = template.content.cloneNode(true) as DocumentFragment;
    //                 // const clone = document.importNode(template.content, true);
    //                 // const clone = document.adoptNode(template.content);
    //                 if (
    //                     !this.shadow ||
    //                     !('attachShadow' in document.body) &&
    //                     !('createShadowRoot' in document.body)
    //                 ) {
    //                     const templateSlots = template.content.querySelectorAll('slot[name]');
    //                     const defaultSlot = template.content.querySelector('slot:not([name])');
    //                     for (let i = 0; i < templateSlots.length; i++) {
    //                         const templateSlot = templateSlots[ i ];
    //                         const name = templateSlot.getAttribute('name');
    //                         const instanceSlot = this.querySelector('[slot="' + name + '"]');
    //                         if (instanceSlot) templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
    //                         else templateSlot.parentNode.removeChild(templateSlot);
    //                     }
    //                     if (this.children.length) {
    //                         while (this.firstChild) {
    //                             if (defaultSlot) defaultSlot.parentNode.insertBefore(this.firstChild, defaultSlot);
    //                             else this.removeChild(this.firstChild);
    //                         }
    //                     }
    //                     if (defaultSlot) defaultSlot.parentNode.removeChild(defaultSlot);
    //                 }
    //                 const tasks = [];
    //                 let child = template.content.firstChild;
    //                 while (child) {
    //                     tasks.push(Binder.add(child, this));
    //                     child = child.nextSibling;
    //                 }
    //                 this.$root.appendChild(template.content);
    //                 return Promise.all(tasks);
    //             }
    //         },
    //         attributeChangedCallback: {
    //             value: async function (name: string, from: string, to: string) {
    //                 await this.attributed(name, from, to);
    //             }
    //         },
    //         adoptedCallback: {
    //             value: async function () {
    //                 if (this.adopted) await this.adopted();
    //             }
    //         },
    //         disconnectedCallback: {
    //             value: async function () {
    //                 Css.detach(this.$name);
    //                 if (this.disconnected) await this.disconnected();
    //             }
    //         },
    //         connectedCallback: {
    //             value: async function () {
    //                 try {
    //                     Css.attach(this.$name, this.css);
    //                     if (this.$flag) {
    //                         if (this.connected) await this.connected();
    //                     } else {
    //                         this.$flag = true;
    //                         await this.render();
    //                         if (this.rendered) await this.rendered();
    //                         if (this.connected) await this.connected();
    //                     }
    //                 } catch (error) {
    //                     console.error(error);
    //                 }
    //             }
    //         }
    //     });
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
            console.log('native import');
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

    const absolute = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };
    var Location = new class Location {
        constructor() {
            this.#data = {};
            this.#folder = '';
            this.#dynamic = true;
            this.#contain = false;
        }
        #target;
        #data;
        #folder;
        #dynamic;
        #contain;
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
        toString() { return window.location.href; }
        back() { window.history.back(); }
        forward() { window.history.forward(); }
        reload() { window.location.reload(); }
        redirect(href) { window.location.href = href; }
        async setup(option) {
            // if (!option.target) throw new Error('target required');
            if ('folder' in option)
                this.#folder = option.folder;
            if ('contain' in option)
                this.#contain = option.contain;
            if ('dynamic' in option)
                this.#dynamic = option.dynamic;
            if ('external' in option)
                this.#external = option.external;
            this.#target = option.target instanceof Element ? option.target : document.body.querySelector(option.target);
            if (this.#dynamic) {
                window.addEventListener('popstate', this.state.bind(this), true);
                if (this.#contain) {
                    this.#target.addEventListener('click', this.click.bind(this), true);
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
        async go(path, options = {}) {
            // if (options.query) {
            //     path += Query(options.query);
            // }
            const mode = options.mode || 'push';
            const location = this.location(path);
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
                catch {
                    component = (await load(absolute(`${this.#folder}/all.js`))).default;
                }
                const name = 'l' + path.replace(/\/+/g, '-');
                window.customElements.define(name, component);
                element = window.document.createElement(name);
                this.#data[location.pathname] = element;
            }
            if (element.title)
                window.document.title = element.title;
            while (this.#target.firstChild) {
                this.#target.removeChild(this.#target.firstChild);
            }
            this.#target.appendChild(element);
            if (this.#after)
                await this.#after(location);
        }
        async state(event) {
            await this.replace(event.state.href);
            window.scroll(event.state.top, 0);
        }
        async click(event) {
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

    var Batcher = new class Batcher {
        constructor(data = {}) {
            this.#reads = [];
            this.#writes = [];
            this.#max = 16;
            this.#pending = false;
            this.#max ?? data.max;
        }
        #reads;
        #writes;
        #max;
        #pending;
        // remove (tasks, task) {
        //     const index = tasks.indexOf(task);
        //     return !!~index && !!tasks.splice(index, 1);
        // }
        // clear (task) {
        //     return this.remove(this.#reads, task) || this.remove(this.#writes, task);
        // }
        tick(method) {
            return new Promise((resolve) => {
                window.requestAnimationFrame(async (time) => {
                    await method.call(this, time);
                    resolve();
                });
            });
        }
        ;
        async flush(time) {
            const tasks = [];
            let read;
            while (read = this.#reads.shift()) {
                tasks.push(read());
                // if ((performance.now() - time) > this.#max) return this.tick(this.flush);
            }
            await Promise.all(tasks);
            let write;
            while (write = this.#writes.shift()) {
                tasks.push(write());
                // if ((performance.now() - time) > this.#max) return this.tick(this.flush);
            }
            await Promise.all(tasks);
            if (this.#reads.length === 0 && this.#writes.length === 0) {
                this.#pending = false;
                // } else if ((performance.now() - time) > this.#max) {
                // return this.tick(this.flush);
            }
            else {
                return this.flush(time);
            }
        }
        async batch(read, write) {
            if (!read && !write)
                throw new Error('read or write required');
            return new Promise((resolve) => {
                if (read) {
                    this.#reads.push(async () => {
                        await read();
                        if (write) {
                            this.#writes.push(async () => {
                                await write();
                                resolve();
                            });
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else if (write) {
                    this.#writes.push(async () => {
                        await write();
                        resolve();
                    });
                }
                if (!this.#pending) {
                    this.#pending = true;
                    this.tick(this.flush);
                }
            });
        }
    };
    // export default Object.freeze({
    //     reads,
    //     writes,
    //     setup,
    //     tick,
    //     flush,
    //     remove,
    //     clear,
    //     batch
    // });

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
                // headers: { enumerable: true, value: result.headers }
                // message: { enumerable: true, value: result.statusText }
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

    const toDash = (data) => data.replace(/[a-zA-Z][A-Z]/g, c => `${c[0]}-${c[1]}`.toLowerCase());
    async function Define(component) {
        if (typeof component === 'string') {
            const loaded = await load(component);
            await Define(loaded.default);
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
    if (window.NodeList && !window.NodeList.prototype.forEach) {
        window.NodeList.prototype.forEach = window.Array.prototype.forEach;
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
