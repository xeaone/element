
    /*
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

    const methods = [ 'push', 'pop', 'splice', 'shift', 'unshift', 'reverse' ];

    const get = function (tasks, handler, path, target, property) {

        if (target instanceof Array && methods.indexOf(property) !== -1) {
            // console.log(path.slice(0, -1));
            tasks.push(handler.bind(null, target, path.slice(0, -1)));
        }

        return target[property];
    };

    const set = function (tasks, handler, path, target, property, value) {

        // if (property === 'length') {
        //     return true;
        // }

        if (target[property] === value) {
            return true;
        }

        target[property] = create(value, handler, path + property, tasks);

        if (tasks.length) {
            Promise.resolve().then(() => {
                let task; while (task = tasks.shift()) task();
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
                    let task; while (task = tasks.shift()) task();
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
        } else if (source instanceof Object) {
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = create(source[key], handler, path + key, tasks);
            }
        }

        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task; while (task = tasks.shift()) task();
            }).catch(console.error);
        }

        return new Proxy(source, {
            get: get.bind(get, tasks, handler, path),
            set: set.bind(set, tasks, handler, path)
        });

    };

    var Observer = { get, set, create };

    function Traverse (data, path, end) {
        const keys = typeof path === 'string' ? path.split('.') : path;
        const length = keys.length - (end || 0);
        let result = data;

        for (let index = 0; index < length; index++) {
            result = result[ keys[ index ] ];
        }

        return result;
    }

    const reads = [];
    const writes = [];

    const options = {
        time: 1000/60,
        pending: false
    };

    const setup = function (options = {}) {
        this.options.time = options.time || this.options.time;
    };

    const tick = function (method) {
        const self = this;
        return new Promise((resolve, reject) => {
            window.requestAnimationFrame((time) => {
                Promise.resolve()
                    .then(method.bind(self, time))
                    .then(resolve)
                    .catch(reject);
            });
        });
    };

    // schedules a new read/write batch if one is not pending
    const schedule = async function () {
        if (this.options.pending) return;
        this.options.pending = true;
        return this.tick(this.flush);
    };

    const flush = async function (time) {

        console.log('reads before:', this.reads.length);
        console.log('write before:', this.writes.length);

        let read;
        while (read = this.reads.shift()) {
            if (read) await read();

            if ((performance.now() - time) > this.options.time) {
                console.log('read max');
                return this.tick(this.flush);
            }

        }

        let write;
        while (write = this.writes.shift()) {
            if (write) await write();

            if ((performance.now() - time) > this.options.time) {
                console.log('write max');
                return this.tick(this.flush);
            }

        }

        console.log('reads after:', this.reads.length);
        console.log('write after:', this.writes.length);

        if (this.reads.length === 0 && this.writes.length === 0) {
            this.options.pending = false;
        } else if ((performance.now() - time) > this.options.time) {
            return this.tick(this.flush);
        } else {
            return this.flush(time);
        }

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

        if (!context) return;
        if (!context.read && !context.write) return;

        self.reads.push(async () =>
            context.read ? context.read.call(context, context) : undefined
        );

        self.writes.push(async () => 
            context.write ? context.write.call(context, context) : undefined
        );

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

    function Match (source, target) {

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
            if (!match) return false;
        }

        return true;
    }

    const isMap = data => data?.constructor === Map;
    const isDate = data => data?.constructor === Date;
    const isArray = data => data?.constructor === Array;
    const isString = data => data?.constructor === String;
    const isNumber = data => data?.constructor === Number;
    const isObject = data => data?.constructor === Object;
    const isBoolean = data => data?.constructor === Boolean;

    const toArray = data => JSON.parse(data);
    const toObject = data => JSON.parse(data);
    const toDate = data => new Date(Number(data));
    const toMap = data => new Map(JSON.parse(data));

    const toBoolean = data => data === 'true';

    const toString = data => typeof data === 'string' ? data : JSON.stringify(data);

    const toNumber = data => data === '' || typeof data !== 'string' && typeof data !== 'number' ? NaN : Number(data);

    const to = function (source, target) {
        try {
            if (isMap(source)) return toMap(target);
            else if (isDate(source)) return toDate(target);
            else if (isArray(source)) return toArray(target);
            else if (isString(source)) return toString(target);
            else if (isObject(source)) return toObject(target);
            else if (isNumber(source)) return toNumber(target);
            else if (isBoolean(source)) return toBoolean(target);
        } catch {
            return target;
        }
    };

    function Checked (binder, event) {

        if (binder.meta.busy) {
            return;
        } else {
            binder.meta.busy = true;
        }

        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.target.addEventListener('input', event => Binder$1.render(binder, event));
        }

        return {
            read (ctx) {
                ctx.data = binder.data;

                if (isBoolean(ctx.data)) {
                    ctx.checked = event ? binder.target.checked : ctx.data;
                } else {
                    ctx.value = binder.getAttribute('value');
                    ctx.checked = Match(ctx.data, ctx.value);
                }

                if (event) {

                    if (isBoolean(ctx.data)) {
                        binder.data = ctx.checked;
                    } else {
                        binder.data = ctx.value;
                    }

                    binder.meta.busy = false;
                    ctx.write = false;
                    return;
                }

            },
            write (ctx) {
                binder.target.checked = ctx.checked;
                binder.target.setAttribute('checked', ctx.checked);
                binder.meta.busy = false;
            }
        };
    }

    function Class (binder) {
        let data, name;
        return {
            read () {
                data = binder.data;

                if (binder.names.length > 1) {
                    name = binder.names.slice(1).join('-');
                }

            },
            write () {
                if (data === undefined || data === null) {
                    if (name) {
                        binder.target.classList.remove(name);
                    } else {
                        binder.target.setAttribute('class', '');
                    }
                } else {
                    if (name) {
                        binder.target.classList.toggle(name, data);
                    } else {
                        binder.target.setAttribute('class', data);
                    }
                }
            }
        };
    }

    function Default (binder) {
        let data;
        return {
            read () {
                data = toString(binder.data);

                if (data === binder.target[binder.type]) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target[binder.type] = data;
                binder.target.setAttribute(binder.type, data);
            }
        };
    }

    function Disable (binder) {
        let data;
        return {
            read () {
                data = binder.data;

                if (data === binder.target.disabled) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.disabled = data;
                binder.target.setAttribute('disabled', data);
            }
        };
    }

    function Each (binder) {

        if (binder.meta.busy) {
            console.log('busy each');
            return;
        } else {
            binder.meta.busy = true;
        }

        let data;

        const read = function () {
            data = binder.data || [];

            if (!binder.meta.setup) {
                binder.meta.keys = [];
                binder.meta.counts = [];
                binder.meta.setup = false;
                binder.meta.busy = false;
                binder.meta.targetLength = 0;
                binder.meta.currentLength = 0;
                binder.meta.templateString = binder.target.innerHTML;
                // binder.meta.fragment = document.createDocumentFragment();
                binder.meta.templateLength = binder.target.childNodes.length;

                while (binder.target.firstChild) {
                    binder.target.removeChild(binder.target.firstChild);
                }

                binder.meta.setup = true;
            }

            binder.meta.keys = data ? Object.keys(data) : [];
            binder.meta.targetLength = binder.meta.keys.length;

            if (binder.meta.currentLength === binder.meta.targetLength) {
                binder.meta.busy = false;
                this.write = false;
            }

        };

        const write = function () {

            if (binder.meta.currentLength > binder.meta.targetLength) {
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;

                    while (count--) {
                        const node = binder.target.lastChild;
                        Promise.resolve().then(Binder$1.remove(node));
                        binder.target.removeChild(node);
                    }

                    binder.meta.currentLength--;
                }
            } else if (binder.meta.currentLength < binder.meta.targetLength) {
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const index = binder.meta.currentLength;
                    const key = binder.meta.keys[index];

                    const variablePattern = new RegExp(`\\[${binder.names[1]}\\]`, 'g');
                    const indexPattern = new RegExp(`({{)?\\[${binder.names[2]}\\](}})?`, 'g');
                    const keyPattern = new RegExp(`({{)?\\[${binder.names[3]}\\](}})?`, 'g');

                    const clone = binder.meta.templateString
                        .replace(variablePattern, `${binder.path}.${key}`)
                        .replace(indexPattern, index)
                        .replace(keyPattern, key);

                    const parsed = new DOMParser().parseFromString(clone, 'text/html').body;

                    let node;
                    while (node = parsed.firstChild) {
                        binder.target.appendChild(node);
                        Promise.resolve().then(Binder$1.add(node, binder.container));
                        // binder.meta.fragment.appendChild(node);
                        // Promise.resolve().then(Binder.add(node, binder.container)).catch(console.error);
                    }

                    binder.meta.currentLength++;
                }
                // binder.target.appendChild(binder.meta.fragment);
            }

            binder.meta.busy = false;
        };

        return { read, write };
    }

    function Enable (binder) {
        let data;
        return {
            read () {
                data = !binder.data;

                if (data === binder.target.disabled) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.disabled = data;
                binder.target.setAttribute('disabled', data);
            }
        };
    }

    function Hide (binder) {
        let data;
        return {
            read () {
                data = binder.data;

                if (data === binder.target.hidden) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.hidden = data;
                binder.target.setAttribute('hidden', data);
            }
        };
    }

    function Href (binder) {
        let data;
        return {
            read () {
                data = binder.data || '';

                if (data === binder.target.href) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.href = data;
                binder.target.setAttribute('href', data);
            }
        };
    }

    function Html (binder) {
        let data;
        return {
            read () {
                data = binder.data;

                if (data === undefined || data === null) {
                    data = '';
                } else if (typeof data === 'object') {
                    data = JSON.stringify(data);
                } else if (typeof data !== 'string') {
                    data = String(data);
                }

            },
            write () {

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

        // binder.meta.method = (event) => {
        //     Batcher.batch({
        //         read (ctx) {
        //             ctx.data = binder.data;
        //             ctx.container = binder.container;
        //             if (typeof ctx.data !== 'function') {
        //                 ctx.write = false;
        //                 return;
        //             }
        //         },
        //         write (ctx) {
        //             ctx.data.call(ctx.container, event);
        //         }
        //     });
        // };

        binder.meta.method = event => {
            binder.data.call(binder.container, event);
        };

        binder.target.addEventListener(type, binder.meta.method);
    }

    // export default function (binder) {
    //     return {
    //         read () {

    //         },
    //         write () {
    //         }
    //     };
    // }

    function Read (binder) {
        let data;
        return {
            read () {
                data = binder.data;

                if (data === binder.target.readOnly) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.readOnly = data;
                binder.target.setAttribute('readonly', data);
            }
        };
    }

    function Require (binder) {
        let data;
        return {
            read () {
                data = binder.data;

                if (data === binder.target.required) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.required = data;
                binder.target.setAttribute('required', data);
            }
        };
    }

    const reset = async function (binder, event) {
        event.preventDefault();

        const elements = event.target.querySelectorAll('*');

        for (let i = 0, l = elements.length; i < l; i++) {
            const element = elements[i];
            const name = element.nodeName;
            const type = element.type;

            if (
                !type && name !== 'TEXTAREA' ||
                type === 'submit' ||
                type === 'button' ||
                !type
            ) {
                continue;
            }

            const binder = Binder$1.get(element, 'o-value');

            if (!binder) {
                if (type === 'select-one' || type === 'select-multiple') {
                    element.selectedIndex = null;
                } else if (type === 'radio' || type === 'checkbox') {
                    element.checked = false;
                } else {
                    element.value = null;
                }
            } else if (type === 'select-one') {
                binder.data = null;
            } else if (type === 'select-multiple') {
                binder.data = [];
            } else if (type === 'radio' || type === 'checkbox') {
                binder.data = false;
            } else {
                binder.data = '';
            }

        }

        const method = binder.data;
        if (typeof method === 'function') {
            await method.call(binder.container, event);
        }

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
            read () {
                data = !binder.data;

                if (data === binder.target.hidden) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.hidden = data;
                binder.target.setAttribute('hidden', data);
            }
        };
    }

    function Style (binder) {
        let data, name, names;
        return {
            read () {
                data = binder.data;

                if (binder.names.length > 1) {

                    name = '';
                    names = binder.names.slice(1);

                    for (let i = 0, l = names.length; i < l; i++) {

                        if (i === 0) {
                            name = names[i].toLowerCase();
                        } else {
                            name += names[i].charAt(0).toUpperCase() + names[i].slice(1).toLowerCase();
                        }

                    }

                }

            },
            write () {

                if (binder.names.length > 1) {

                    if (data) {
                        binder.target.style[name] = data;
                    } else {
                        binder.target.style[name] = '';
                    }

                } else {

                    if (data) {
                        binder.target.style.cssText = data;
                    } else {
                        binder.target.style.cssText = '';
                    }

                }

            }
        };
    }

    const submit = async function (binder, event) {
        event.preventDefault();

        const data = {};
        const elements = event.target.querySelectorAll('*');

        for (let i = 0, l = elements.length; i < l; i++) {
            const element = elements[i];

            if (
                (!element.type && element.nodeName !== 'TEXTAREA') ||
                element.type === 'submit' ||
                element.type === 'button' ||
                !element.type
            ) continue;

            const attribute = element.attributes['o-value'];
            const b = Binder$1.get(attribute);

            console.warn('todo: need to get a value for selects');

            const value = (
                b ? b.data : (
                    element.files ? (
                        element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0]
                    ) : element.value
                )
            );

            const name = element.name || (b ? b.values[b.values.length - 1] : null);

            if (!name) continue;
            data[name] = value;
        }

        // if (typeof binder.data === 'function') {
        //     await binder.data.call(binder.container, data, event);
        // }

        const method = binder.data;
        if (typeof method === 'function') {
            await method.call(binder.container, data, event);
        }

        if (binder.getAttribute('reset')) {
            event.target.reset();
        }

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

        // binder.meta.method = function (events) {
        //     const parameters = [];
        //
        //     for (let i = 0, l = binder.pipes.length; i < l; i++) {
        //         const keys = binder.pipes[i].split('.');
        //         const parameter = Traverse(binder.container.model, keys);
        //         parameters.push(parameter);
        //     }
        //
        //     parameters.push(events);
        //     parameters.push(this);
        //
        //     Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
        // };

        binder.meta.method = submit.bind(this, binder);
        binder.target.addEventListener('submit', binder.meta.method);
    }

    function Text (binder) {
        let data;
        return {
            read () {
                data = toString(binder.data);

                if (data === binder.target.textContent) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.textContent = data;
            }
        };
    }

    function Index (items, item) {

        for (let i = 0; i < items.length; i++) {
            if (Match(items[i], item)) {
                return i;
            }
        }

        return -1;
    }

    const input = function (binder) {
        const type = binder.target.type;

        if (type === 'select-one' || type === 'select-multiple') ; else if (type === 'checkbox' || type === 'radio') {
            binder.data = to(binder.data, binder.target.value);
        } else if (type === 'number') {
            binder.data = toNumber(binder.target.value);
        } else if (type === 'file') {
            const multiple = binder.target.multiple;
            binder.data = multiple ? [ ...binder.target.files ] : binder.target.files[0];
        } else {
            binder.data = binder.target.value;
        }
    };

    function Value (binder, event) {
        const type = binder.target.type;

        if (binder.meta.busy) {
            console.log('busy value');
            return;
        } else {
            binder.meta.busy = true;
        }

        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.target.addEventListener('input', () => input(binder));
            // binder.target.addEventListener('input', event => Binder.render(binder, event));
            // binder.target.addEventListener('change', event => Binder.render(binder, event));
        }

        if (type === 'select-one' || type === 'select-multiple') {
            return {
                read (ctx) {

                    console.log(event);
                    console.log(binder.target);
                    console.log(binder.data);

                    ctx.selectBinder = binder;
                    ctx.select =  binder.target;
                    ctx.options = binder.target.options;
                    ctx.multiple = binder.target.multiple;

                    if (ctx.multiple && binder.data instanceof Array === false) {
                        ctx.data = binder.data = [];
                        // binder.meta.busy = false;
                        // throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                    } else {
                        ctx.data = binder.data;
                    }

                    ctx.selects = [];
                    ctx.unselects = [];

                    for (let i = 0; i < ctx.options.length; i++) {
                        const node = ctx.options[i];
                        const selected = node.selected;
                        const attribute = node.attributes['o-value'] || node.attributes['value'];
                        const option = Binder$1.get(attribute) || { get data () { return node.value; }, set data (data) { node.value = data; } };
                        if (ctx.multiple) {
                            const index = Index(binder.data, option.data);
                            if (event) {
                                if (selected && index === -1) {
                                    binder.data.push(option.data);
                                } else if (!selected && index !== -1) {
                                    binder.data.splice(index, 1);
                                }
                            } else {
                                if (index === -1) {
                                    ctx.unselects.push(node);
                                    // option.selected = false;
                                } else {
                                    ctx.selects.push(node);
                                    // option.selected = true;
                                }
                            }
                        } else {
                            const match = Match(binder.data, option.data);
                            if (event) {
                                if (selected && !match) {
                                    binder.data = option.data;
                                } else if (!selected && match) {
                                    continue;
                                }
                            } else {
                                if (match) {
                                    ctx.selects.push(node);
                                    // option.selected = true;
                                } else {
                                    ctx.unselects.push(node);
                                    // option.selected = false;
                                }
                            }
                        }
                    }

                    // if (binder.data === ctx.data) {
                    //     return ctx.write = false;
                    // }

                    // for (let i = 0; i < ctx.options.length; i++) {
                    //     const target = ctx.options[i];
                    //     const attribute = target.attributes['o-value'] || target.attributes['value'];
                    //     Binder.render(
                    //         Binder.get(attribute) ||
                    //         { meta: {}, target, get data () { return target.value; }, set data (data) { target.value = data; } },
                    //         event
                    //     );
                    // }

                    // binder.meta.busy = false;
                },
                write (ctx) {
                    const { selects, unselects } = ctx;

                    selects.forEach(option => {
                        option.selected = true;
                        console.log(option, option.selected, 'select');
                    });

                    unselects.forEach(option => {
                        option.selected = false;
                        console.log(option, option.selected, 'unselects');
                    });

                    // const { options, multiple, selectBinder } = ctx;
                    //
                    // for (let i = 0; i < options.length; i++) {
                    //     const option = options[i];
                    //     const selected = option.selected;
                    //
                    //     const attribute = option.attributes['o-value'] || option.attributes['value'];
                    //     const optionBinder = Binder.get(attribute) || { get data () { return option.value; }, set data (data) { option.value = data; } };
                    //
                    //     if (multiple) {
                    //         const index = Index(ctx.data, optionBinder.data);
                    //         if (event) {
                    //             if (selected && index === -1) {
                    //                 ctx.data.push(optionBinder.data);
                    //             } else if (!selected && index !== -1) {
                    //                 ctx.data.splice(index, 1);
                    //             }
                    //         } else {
                    //             if (index === -1) {
                    //                 option.selected = false;
                    //             } else {
                    //                 option.selected = true;
                    //             }
                    //         }
                    //     } else {
                    //         const match = Match(ctx.data, optionBinder.data);
                    //         if (event) {
                    //             if (selected && !match) {
                    //                 binder.data = optionBinder.data;
                    //                 break;
                    //             }
                    //         } else {
                    //             if (match) {
                    //                 option.selected = true;
                    //             } else {
                    //                 option.selected = false;
                    //             }
                    //         }
                    //     }
                    // }

                    // if (binder.data !== data) {
                    //     binder.data = data;
                    // }

                    binder.meta.busy = false;
                }
                //
                //     const fallback = [];
                //     const multiple = ctx.multiple;
                //     const options = ctx.options;
                //     for (let i = 0; i < options.length; i++) {
                //
                //         const option = options[i];
                //         const selected = option.selected;
                //         const optionBinder = Binder.get(option, 'value');
                //         const value = optionBinder ? optionBinder.data : option.value;
                //
                //         if (option.hasAttribute('selected')) {
                //             fallback.push({ option, value });
                //         }
                //
                //         // console.log(binder.data, value, binder.data===value);
                //
                //         if (e) {
                //             if (multiple) {
                //                 if (selected) {
                //                     const includes = Includes(binder.data, value);
                //                     if (!includes) {
                //                         binder.data.push(value);
                //                     }
                //                 } else {
                //                     const index = Index(binder.data, value);
                //                     if (index !== -1) {
                //                         binder.data.splice(index, 1);
                //                     }
                //                 }
                //             } else {
                //                 if (selected) {
                //                     binder.data = value;
                //                     break;
                //                 }
                //             }
                //         } else {
                //             if (multiple) {
                //                 const includes = Includes(binder.data, value);
                //                 if (includes) {
                //                     option.selected = true;
                //                 } else {
                //                     option.selected = false;
                //                 }
                //             } else {
                //                 const match = Match(binder.data, value);
                //                 if (match) {
                //                     option.selected = true;
                //                     break;
                //                 }
                //             }
                //         }
                //     }
                //
                //     if (ctx.selectedIndex === -1) {
                //         if (multiple) {
                //             for (let i = 0; i < fallback.length; i++) {
                //                 const { option, value } = fallback[i];
                //                 if (e) {
                //                     binder.data.push(value);
                //                 } else {
                //                     option.selected = true;
                //                 }
                //             }
                //         } else {
                //             // const { option, value } = fallback[0] || ctx.options[0];
                //             // if (e) {
                //             //     binder.data = value;
                //             // } else {
                //             //     option.selected = true;
                //             // }
                //         }
                //     }
                //
            };
        } else if (type === 'checkbox' || type === 'radio') {
            return {
                read (ctx) {
                    ctx.data = binder.data;
                },
                write (ctx) {
                    ctx.value = toString(ctx.data);
                    binder.target.value = ctx.value;
                    binder.target.setAttribute('value', ctx.value);
                    binder.meta.busy = false;
                }
            };

        } else if (type === 'number') {
            return {
                read (ctx) {
                    ctx.data = binder.data;
                    ctx.value = toNumber(binder.target.value);
                },
                write (ctx) {
                    ctx.value = toString(ctx.data);
                    binder.target.value = ctx.value;
                    binder.target.setAttribute('value', ctx.value);
                    binder.meta.busy = false;
                }
            };
        } else if (type === 'file') {
            return {
                read (ctx) {
                    ctx.data = binder.data;
                    ctx.multiple = binder.target.multiple;
                    ctx.value = ctx.multiple ? [ ...binder.target.files ] : binder.target.files[0];
                }
            };
        } else {
            return {
                read (ctx) {
                    // if (binder.target.nodeName === 'O-OPTION' || binder.target.nodeName === 'OPTION') return ctx.write = false;

                    ctx.data = binder.data;
                    ctx.value = binder.target.value;
                    // ctx.match = Match(ctx.data, ctx.value);
                    // ctx.selected = binder.target.selected;

                    // if (ctx.match) {
                    //     binder.meta.busy = false;
                    //     ctx.write = false;
                    //     return;
                    // }

                    // if (
                    //     binder.target.parentElement &&
                    //     (binder.target.parentElement.type === 'select-one'||
                    //     binder.target.parentElement.type === 'select-multiple')
                    // ) {
                    //     ctx.select = binder.target.parentElement;
                    // } else if (
                    //     binder.target.parentElement &&
                    //     binder.target.parentElement.parentElement &&
                    //     (binder.target.parentElement.parentElement.type === 'select-one'||
                    //     binder.target.parentElement.parentElement.type === 'select-multiple')
                    // ) {
                    //     ctx.select = binder.target.parentElement.parentElement;
                    // }
                    //
                    // if (ctx.select) {
                    //     const attribute = ctx.select.attributes['o-value'] || ctx.select.attributes['value'];
                    //     if (!attribute) return ctx.write = false;
                    //     ctx.select = Binder.get(attribute);
                    //     ctx.multiple = ctx.select.target.multiple;
                    // }

                },
                write (ctx) {
                    // const { select, selected, multiple } = ctx;

                    // if (select) {
                    //     if (multiple) {
                    //         const index = Index(select.data, ctx.data);
                    //         if (event) {
                    //             if (selected && index === -1) {
                    //                 select.data.push(ctx.data);
                    //             } else if (!selected && index !== -1) {
                    //                 select.data.splice(index, 1);
                    //             }
                    //         } else {
                    //             if (index === -1) {
                    //                 binder.target.selected = false;
                    //             } else {
                    //                 binder.target.selected = true;
                    //             }
                    //         }
                    //     } else {
                    //         const match = Match(select.data, ctx.data);
                    //         if (event) {
                    //             // console.log(match);
                    //             // console.log(select.data);
                    //             // console.log(ctx.data);
                    //             if (selected !== match) {
                    //                 select.data = ctx.data;
                    //                 // console.log(select.data);
                    //                 // throw 'stop';
                    //             }
                    //         } else {
                    //             if (match) {
                    //                 binder.target.selected = true;
                    //             } else {
                    //                 binder.target.selected = false;
                    //             }
                    //         }
                    //     }
                    // }
                    // select.meta.busy = false;

                    binder.target.value = ctx.data ?? '';
                    binder.meta.busy = false;
                }
            };
        }
    }

    function Write (binder) {
        let data;
        return {
            read () {
                data = !binder.data;

                if (data === binder.target.readOnly) {
                    this.write = false;
                    return;
                }

            },
            write () {
                binder.target.readOnly = data;
                binder.target.setAttribute('readonly', data);
            }
        };
    }

    const PIPE = /\s?\|\s?/;
    const PIPES = /\s?,\s?|\s+/;
    const PATH = /\s?,\s?|\s?\|\s?|\s+/;

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

        async setup (options = {}) {
            const { binders } = options;

            if (binders) {
                for (const name in binders) {
                    if (name in this.binders === false) {
                        this.binders[name] = binders[name].bind(this);
                    }
                }
            }

        },

        get (node) {
            return this.data.get(node);
        },

        render (binder) {
            const type = binder.type in this.binders ? binder.type : 'default';
            const render = this.binders[type](...arguments);
            Batcher.batch(render);
        },

        unbind (node) {
            return this.data.remove(node);
        },

        bind (target, name, value, container, attr) {
            const self = this;

            value = value.replace(this.syntaxReplace, '').trim();
            name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();

            if (name.indexOf('on') === 0) {
                name = 'on-' + name.slice(2);
            }

            const pipe = value.split(PIPE);
            const paths = value.split(PATH);

            const names = name.split('-');
            const values = pipe[0] ? pipe[0].split('.') : [];
            const pipes = pipe[1] ? pipe[1].split(PIPES) : [];

            const meta = {};
            const type = names[0];
            const path = paths[0];
            const keys = paths[0].split('.');
            const property = keys.slice(-1)[0];

            const binder = Object.freeze({

                type, path,
                name, value, target, container,
                keys, names, pipes, values, meta,

                render: self.render,

                getAttribute (name) {
                    const node = target.getAttributeNode(name);
                    if (!node) return undefined;
                    const data = self.data?.get(node)?.data;
                    return data === undefined ? node.value : data;
                },

                get data () {
                // if (names[0] === 'on') {
                //     const source = Traverse(container.methods, keys, 1);
                //     return source[property];
                // } else {
                    const source = Traverse(container.model, keys, 1);
                    return source[property];
                    // if (names[0] === 'value') {
                    //     return source[property];
                    // } else {
                    //     return Piper(this, source[property]);
                    // }
                // }
                },

                set data (value) {
                // if (names[0] === 'on') {
                //     const source = Traverse(container.methods, keys, 1);
                //     source[property] = value;
                // } else {
                    const source = Traverse(container.model, keys, 1);
                    source[property] = value;
                    // if (names[0] === 'value') {
                    //     source[property] = Piper(this, value);
                    // } else {
                    //     source[property] = value;
                    // }
                // }
                }

            });

            this.data.set(attr || binder.target, binder);

            if (target.nodeName.includes('-')) {
                window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            } else {
                this.render(binder);
            }

        },

        remove (node) {

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

        add (node, container) {
            const type = node.nodeType;
            // if (node.nodeType === Node.ATTRIBUTE_NODE) {
            //     if (node.name.indexOf(this.prefix) === 0) {
            //         this.bind(node, node.name, node.value, container, attribute);
            //     }
            // } else
            if (type === Node.TEXT_NODE) {

                const start = node.textContent.indexOf(this.syntaxStart);
                if (start === -1)  return;

                if (start !== 0) node = node.splitText(start);

                const end = node.textContent.indexOf(this.syntaxEnd);
                if (end === -1) return;

                if (end+this.syntaxStart.length !== node.textContent.length) {
                    const split = node.splitText(end + this.syntaxEnd.length);
                    this.bind(node, 'text', node.textContent, container);
                    this.add(split);
                } else {
                    this.bind(node, 'text', node.textContent,  container);
                }

            } else if (type === Node.ELEMENT_NODE) {
                let skip = false;

                const attributes = node.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    const { name, value } = attribute;

                    if (
                        name.indexOf(this.prefix) === 0
                        ||
                        (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1)
                        ||
                        (value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1)
                    ) {

                        if (
                            name.indexOf('each') === 0
                            ||
                            name.indexOf(`${this.prefix}each`) === 0
                        ) {
                            skip = true;
                        }

                        this.bind(node, name, value, container, attribute);
                    }

                }

                if (skip) return;

                node = node.firstChild;
                while (node) {
                    this.add(node, container);
                    node = node.nextSibling;
                }

            }
        }

    };

    var Binder$1 = Object.freeze({ ...Binder, ...properties });

    // import Style from './style.js';

    const compose = function (instance, template) {
        const templateSlots = template.querySelectorAll('slot[name]');
        const defaultSlot = template.querySelector('slot:not([name])');

        for (let i = 0; i < templateSlots.length; i++) {

            const templateSlot = templateSlots[i];
            const name = templateSlot.getAttribute('name');
            const instanceSlot = instance.querySelector('[slot="'+ name + '"]');

            if (instanceSlot) {
                templateSlot.parentNode.replaceChild(instanceSlot, templateSlot);
            } else {
                templateSlot.parentNode.removeChild(templateSlot);
            }

        }

        if (instance.children.length) {
            while (instance.firstChild) {
                if (defaultSlot) {
                    defaultSlot.parentNode.insertBefore(instance.firstChild, defaultSlot);
                } else {
                   instance.removeChild(instance.firstChild);
                }
            }
        }

        if (defaultSlot) {
            defaultSlot.parentNode.removeChild(defaultSlot);
        }

    };

    class Component extends HTMLElement {

        static count = 0
        static attributes = []
        static get observedAttributes () { return this.attributes; }
        static set observedAttributes (attributes) { this.attributes = attributes; }

        #root


        #binder
        get binder () { return this.#binder; }

        #template = ''
        get template () { return this.#template; }

        #model = {}
        get model () { return this.#model; }

        #methods = {}
        get methods () { return this.#methods; }

        constructor () {
            super();

            this.adopt = typeof this.adopt === 'boolean' ? this.adopt : false;
            this.shadow = typeof this.shadow === 'boolean' ? this.shadow : false;
            this.adopted = typeof this.adopted === 'function' ? this.adopted : function () {};
            this.created = typeof this.created === 'function' ? this.created : function () {};
            this.attached = typeof this.attached === 'function' ? this.attached : function () {};
            this.detached = typeof this.detached === 'function' ? this.detached : function () {};

            // if (typeof this.style === 'string') {
            //     Style.append(
            //         this.style
            //             .replace(/\n|\r|\t/g, '')
            //             .replace(/:host/g, name)
            //     );
            // }

            this.#binder = Binder$1;

            this.#methods = this.constructor.methods || {};
            this.#template = this.constructor.template || '';

            this.#model = Observer.create(this.constructor.model || {} , (data, path) => {
                Binder$1.data.forEach(binder => {
                    if (binder.container === this && binder.path === path) {
                        Binder$1.render(binder);
                    }
                });
            }); 

        }

        render () {

            const template = document.createElement('template');
            template.innerHTML = this.template;

            const clone = template.content.cloneNode(true);

            if (this.adopt === true) {
                let child = this.firstElementChild;
                while (child) {
                    Binder$1.add(child, this);
                    child = child.nextElementSibling;
                }
            }

            if (this.shadow && 'attachShadow' in document.body) {
                this.#root = this.attachShadow({ mode: 'open' });
            } else if (this.shadow && 'createShadowRoot' in document.body) {
                this.#root = this.createShadowRoot();
            } else {
                compose(this, clone);
                this.#root = this;
            }

            // if (fragment) root.appendChild(fragment);
            // root.appendChild(fragment);

            let child = clone.firstElementChild;
            while (child) {
                // if (this.adopt === false) 
                Binder$1.add(child, this);
                this.#root.appendChild(child);
                child = clone.firstElementChild;
            }

        }

        attributeChangedCallback () {
            Promise.resolve().then(() => this.attributed(...arguments));
        }

        adoptedCallback () {
            Promise.resolve().then(() => this.adopted());
        }

        disconnectedCallback () {
            Promise.resolve().then(() => this.detached());
        }

        connectedCallback () {
            if (this.CREATED) {
                Promise.resolve().then(() => this.attached());
            } else {
                this.CREATED = true;
                this.render();
                Promise.resolve().then(() => this.created()).then(() => this.attached());
            }
        }

    }

    function Location (data) {
        data = data || window.location.href;

        const parser = document.createElement('a');

        parser.href = data;

        const location = {
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

    var Fetcher = Object.freeze({

        option: {},
        
        types: Object.freeze([
            'json',
            'text',
            'blob',
            'formData',
            'arrayBuffer'
        ]),

        mime: Object.freeze({
            xml: 'text/xml; charset=utf-8',
            html: 'text/html; charset=utf-8',
            text: 'text/plain; charset=utf-8',
            json: 'application/json; charset=utf-8',
            js: 'application/javascript; charset=utf-8'
        }),

        async setup (option = {}) {
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
        },

        async method (method, data) {
            data = typeof data === 'string' ? { url: data } : data;
            data.method = method;
            return this.fetch(data);
        },

        async get () {
            return this.method('get', ...arguments);
        },
        
        async put () {
            return this.method('put', ...arguments);
        },
        
        async post () {
            return this.method('post', ...arguments);
        },
        
        async head () {
            return this.method('head', ...arguments);
        },
        
        async patch () {
            return this.method('patch', ...arguments);
        },
        
        async delete () {
            return this.method('delete', ...arguments);
        },
        
        async options () {
            return this.method('options', ...arguments);
        },
        
        async connect () {
            return this.method('connect', ...arguments);
        },

        async serialize (data) {
            let query = '';

            for (const name in data) {
                query = query.length > 0 ? query + '&' : query;
                query = query + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
            }

            return query;
        },

        async fetch (data = {}) {
            const { option } = this;
            const context = { ...option, ...data };

            if (context.path && typeof context.path === 'string' && context.path.charAt(0) === '/') context.path = context.path.slice(1);
            if (context.origin && typeof context.origin === 'string' && context.origin.charAt(context.origin.length-1) === '/') context.origin = context.origin.slice(0, -1);
            if (context.path && context.origin && !context.url) context.url = context.origin + '/' + context.path;

            if (!context.method) throw new Error('Oxe.fetcher - requires method option');
            if (!context.url) throw new Error('Oxe.fetcher - requires url or origin and path option');

            context.aborted = false;
            context.headers = context.headers || {};
            context.method = context.method.toUpperCase();

            Object.defineProperty(context, 'abort', {
                enumerable: true,
                value () { context.aborted = true; return context; }
            });

            if (context.contentType) {
                switch (context.contentType) {
                case 'js': context.headers['Content-Type'] = this.mime.js; break;
                case 'xml': context.headers['Content-Type'] = this.mime.xml; break;
                case 'html': context.headers['Content-Type'] = this.mime.html; break;
                case 'json': context.headers['Content-Type'] = this.mime.json; break;
                default: context.headers['Content-Type'] = context.contentType;
                }
            }

            if (context.acceptType) {
                switch (context.acceptType) {
                case 'js': context.headers['Accept'] = this.mime.js; break;
                case 'xml': context.headers['Accept'] = this.mime.xml; break;
                case 'html': context.headers['Accept'] = this.mime.html; break;
                case 'json': context.headers['Accept'] = this.mime.json; break;
                default: context.headers['Accept'] = context.acceptType;
                }
            }

            if (typeof option.request === 'function') await option.request(context);
            if (context.aborted) return;

            if (context.body) {
                if (context.method === 'GET') {
                    context.url = context.url + '?' + await this.serialize(context.body);
                } else if (context.contentType === 'json') {
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
            } else {
                const responseType = context.responseType === 'buffer' ? 'arrayBuffer' : context.responseType || '';
                const contentType = result.headers.get('content-type') || result.headers.get('Content-Type') || '';

                let type;
                if (responseType === 'json' && contentType.indexOf('json') !== -1) {
                    type = 'json';
                } else {
                    type = responseType || 'text';
                }

                if (this.types.indexOf(type) === -1) {
                    throw new Error('Oxe.fetch - invalid responseType value');
                }

                context.body = await result[type]();
            }

            if (typeof option.response === 'function') await option.response(context);
            if (context.aborted) return;

            return context;
        }

    });

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

        const Class = function Class () {
            const self = this;
            // const self = constructor.apply(this, arguments) || this;
            // console.log(child.hasOwnProperty('constructor'));

            constructor.apply(self, arguments);

            if ('super' in self) {
                if ('_super' in self) {
                    return assignOwnPropertyDescriptors(self._super, self);
                } else {
                    throw new Error('Class this.super call required');
                }
            } else {
                return self;
            }

        };

        if (parent) {
            assignOwnPropertyDescriptors(Class, parent);
            Class.prototype = Object.create(parent.prototype);
            assignOwnPropertyDescriptors(Class.prototype, prototype);

            const Super = function Super () {
                if (this._super) return this._super;
                this._super = window.Reflect.construct(parent, arguments, this.constructor);
                assignOwnPropertyDescriptors(this.super, parent.prototype);
                return this._super;
            };

            Object.defineProperty(Class.prototype, 'super', { enumerable: false, writable: true, value: Super });
        } else {
            Class.prototype = Object.create({});
            assignOwnPropertyDescriptors(Class.prototype, prototype);
        }

        Object.defineProperty(Class.prototype, 'constructor', { enumerable: false, writable: true, value: Class });

        return Class;
    }

    const single = '/';
    const double = '//';
    const colon = '://';
    const ftp = 'ftp://';
    const file = 'file://';
    const http = 'http://';
    const https = 'https://';

    function absolute (path) {
        if (
            path.slice(0, single.length) === single ||
            path.slice(0, double.length) === double ||
            path.slice(0, colon.length) === colon ||
            path.slice(0, ftp.length) === ftp ||
            path.slice(0, file.length) === file ||
            path.slice(0, http.length) === http ||
            path.slice(0, https.length) === https 
        ) {
            return true;
        } else {
            return false;
        }
    }

    function resolve (path) {
        path = path.trim();

        for (let i = 1; i < arguments.length; i++) {
            const part = arguments[i].trim();

            if (path[path.length-1] !== '/' && part[0] !== '/') {
                path += '/';
            }

            path += part;
        }

        const a = window.document.createElement('a');
        
        a.href = path;

        return a.href;
    }

    function fetch (url) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`failed to import: ${url}`));
                    }
                }
            };

            try {
                xhr.open('GET', url, true);
                xhr.send();
            } catch {
                reject(new Error(`failed to import: ${url}`));
            }

        });
    }

    function run (code) {
        return new Promise(function (resolve, reject) {
            const blob = new Blob([ code ], { type: 'text/javascript' });
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

            window.document.head.appendChild(script);
        });
    }

    // https://regexr.com/4uued
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

    // https://regexr.com/4uq22

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
            code = code.replace(
                templateMatch,
                templateMatch
                    .replace(/'/g, '\\' + '\'')
                    .replace(/^([^\\])?`/, '$1\'')
                    .replace(/([^\\])?`$/, '$1\'')
                    .replace(/\${(.*)?}/g, '\'+$1+\'')
                    .replace(/\n/g, '\\n')
            );
        }

        const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
        const importMatches = code.match(R_IMPORTS) || [];
        for (let i = 0, l = importMatches.length; i < l; i++) {
            const importMatch = importMatches[i].match(R_IMPORT);
            if (!importMatch) continue;

            const rawImport = importMatch[0];
            const nameImport = importMatch[1]; // default
            let pathImport = importMatch[4] || importMatch[5];

            if (absolute(pathImport)) {
                pathImport = resolve(pathImport);
            } else {
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
                } else {
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
        if (!url) throw new Error('Oxe.load - url required');

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

        console.log('not native import');

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
        } else {
            console.log('noModule: no');
            code = await fetch(url);
            code = transform(code, url);
        }

        try {
            await run(code);
        } catch {
            throw new Error(`Oxe.load - failed to import: ${url}`);
        }

        return this.modules[url];
    };

    window.LOAD = window.LOAD || load;
    window.MODULES = window.MODULES || {};

    // load.modules = load.modules || {};

    // window.importer = window.importer || importer;
    // window.importer.modules = window.importer.modules || {};
    // window.DYNAMIC_SUPPORT = 'DYNAMIC_SUPPORT' in window ? window.DYNAMIC_SUPPORT : undefined;
    // window.REGULAR_SUPPORT = 'REGULAR_SUPPORT' in window ? window.REGULAR_SUPPORT : undefined;
    //
    // const observer = new MutationObserver(mutations => {
    //     mutations.forEach(({ addedNodes }) => {
    //         addedNodes.forEach(node => {
    //             if (
    //                 node.nodeType === 1 &&
    //                 node.nodeName === 'SCRIPT'&&
    //                 node.type === 'module' &&
    //                 node.src
    //             ) {
    //                 const src = node.src;
    //                 // node.src = '';
    //                 node.type = 'module/blocked';
    //                 Promise.resolve().then(() => dynamic()).then(() => {
    //                     if (window.DYNAMIC_SUPPORT) {
    //                         // node.src = src;
    //                         node.type = 'module';
    //                     } else {
    //                         return window.importer(src);
    //                     }
    //                 });
    //             }
    //         });
    //     });
    // });
    //
    // observer.observe(document.documentElement, { childList: true, subtree: true });

    // const load = function load () {
    //     const scripts = document.getElementsByTagName('script');
    //     // var anonCnt = 0;
    //
    //     for (let i = 0; i < scripts.length; i++) {
    //         const script = scripts[i];
    //         if (script.type == 'module' && !script.loaded) {
    //             script.loaded = true;
    //             if (script.src) {
    //                 script.parentElement.reomveChild(script);
    //                 window.importer(script.src);
    //             } else {
    //             // anonymous modules supported via a custom naming scheme and registry
    //                 // var uri = './<anon' + ++anonCnt + '>';
    //                 // if (script.id !== ""){
    //                 //     uri = "./" + script.id;
    //                 // }
    //                 //
    //                 // var anonName = resolveIfNotPlain(uri, baseURI);
    //                 // anonSources[anonName] = script.innerHTML;
    //                 // loader.import(anonName);
    //             }
    //         }
    //     }
    //
    //     // document.removeEventListener('DOMContentLoaded', , false );
    // };

    // if (document.readyState === 'complete') {
    //     load();
    // } else {
    //     document.addEventListener('DOMContentLoaded', load, false);
    // }

    function Define (name, constructor) {
        if (!name) throw new Error('Oxe.define - name required');
        if (!name) throw new Error('Oxe.define - constructor required');
        if (typeof constructor === 'string') {
            return Promise.resolve()
                .then(() => load(constructor))
                .then((data) => Define(name, data.default));
        } else if (typeof constructor === 'function') {
            window.customElements.define(name, constructor);
        } else if (constructor instanceof Array) {
            constructor.forEach(Define.bind(this, name));
        } else {
            Define(name, Class$1(Component, constructor));
        }
    }

    function Events (target, name, detail, options) {
        options = options || {};
        options.detail = detail === undefined ? null : detail;
        target.dispatchEvent(new window.CustomEvent(name, options));
    }

    function Query (data) {
        data = data || window.location.search;

        if (typeof data === 'string') {

            const result = {};

            if (data.indexOf('?') === 0) data = data.slice(1);
            const queries = data.split('&');

            for (let i = 0; i < queries.length; i++) {
                const [ name, value ] = queries[i].split('=');
                if (name !== undefined && value !== undefined) {
                    if (name in result) {
                        if (typeof result[name] === 'string') {
                            result[name] = [ value ];
                        } else {
                            result[name].push(value);
                        }
                    } else {
                        result[name] = value;
                    }
                }
            }

            return result;

        } else {

            const result = [];

            for (const key in data) {
                const value = data[key];
                result.push(`${key}=${value}`);
            }

            return `?${result.join('&')}`;
            
        }

    }

    function normalize (path) {
        return path
            .replace(/\/+/g, '/')
            .replace(/\/$/g, '')
            || '.';
    }

    function basename (path, extention) {
        path = normalize(path);

        if (path.slice(0, 1) === '.') {
            path = path.slice(1);
        }

        if (path.slice(0, 1) === '/') {
            path = path.slice(1);
        }

        const last = path.lastIndexOf('/');
        if (last !== -1) {
            path = path.slice(last+1);
        }

        if (extention && path.slice(-extention.length) === extention) {
            path = path.slice(0, -extention.length);
        }

        return path;
    }

    // import normalize from './path/normalize.js';

    const self = {};
    const data = [];

    const absolute$1 = function (path) {
        const a = document.createElement('a');
        a.href = path;
        return a.pathname;
    };

    const setup$1 = async function (option = {}) {

        self.after = option.after;
        self.before = option.before;
        self.external = option.external;
        self.mode = option.mode || 'push';
        self.target = option.target || 'main';
        self.folder = option.folder || './routes';
        self.contain = option.contain === undefined ? false : option.contain;

        if (typeof self.target === 'string') {
            self.target = document.body.querySelector(self.target);
        }

        if (self.mode !== 'href') {
            window.addEventListener('popstate', this.state.bind(this), true);
            window.document.addEventListener('click', this.click.bind(this), true);
        }

        await this.add(option.routes);
        await this.route(window.location.href, { mode: 'replace' });
    };

    const compareParts = function (routePath, userPath, split) {
        const compareParts = [];

        const routeParts = routePath.split(split);
        const userParts = userPath.split(split);

        if (userParts.length > 1 && userParts[userParts.length - 1] === '') {
            userParts.pop();
        }

        if (routeParts.length > 1 && routeParts[routeParts.length - 1] === '') {
            routeParts.pop();
        }

        for (let i = 0, l = routeParts.length; i < l; i++) {

            if (routeParts[i].slice(0, 1) === '(' && routeParts[i].slice(-1) === ')') {

                if (routeParts[i] === '(~)') {
                    return true;
                } else if (routeParts[i].indexOf('~') !== -1) {
                    if (userParts[i]) {
                        compareParts.push(userParts[i]);
                    }
                } else {
                    compareParts.push(userParts[i]);
                }

            } else if (routeParts[i] !== userParts[i]) {
                return false;
            } else {
                compareParts.push(routeParts[i]);
            }

        }

        if (compareParts.join(split) === userParts.join(split)) {
            return true;
        } else {
            return false;
        }
    };

    const compare = function (routePath, userPath) {

        // userPath = Resolve(userPath);
        // routePath = Resolve(routePath);

        userPath = absolute$1(userPath);
        routePath = absolute$1(routePath);

        if (this.compareParts(routePath, userPath, '/')) {
            return true;
        }

        if (this.compareParts(routePath, userPath, '-')) {
            return true;
        }

        return false;
    };

    const scroll = function (x, y) {
        window.scroll(x, y);
    };

    const back = function () {
        window.history.back();
    };

    const forward = function () {
        window.history.forward();
    };

    const redirect = function (path) {
        window.location.href = path;
    };

    const add = async function (data) {
        if (!data) {
            throw new Error('Oxe.router.add - options required');
            // return;
        } else if (typeof data === 'string') {
            let load = data;
            let path = data;
            const name = `r-${data.replace('/', '-')}`;
            if (path.slice(-3) === '.js') path = path.slice(0, -3);
            if (path.slice(-5) === 'index') path = path.slice(0, -5);
            if (path.slice(-6) === 'index/') path = path.slice(0, -6);
            if (path.slice(0, 2) === './') path = path.slice(2);
            if (path.slice(0, 1) !== '/') path = '/' + path;

            if (load.slice(-3) !== '.js') load = load + '.js';
            if (load.slice(0, 2) === './') load = load.slice(2);
            if (load.slice(0, 1) !== '/') load = '/' + load;

            if (load.slice(0, 1) === '/') load = load.slice(1);
            if (self.folder.slice(-1) === '/') self.folder = self.folder.slice(0, -1);

            load = self.folder + '/' + load;
            load = absolute$1(load);

            this.add({ path, name, load });
        } else if (data instanceof Array) {
            for (let i = 0; i < data.length; i++) {
                await this.add(data[i]);
            }
        } else {

            if (!data.name) throw new Error('Oxe.router.add - name required');
            if (!data.path) throw new Error('Oxe.router.add - path required');
            if (!data.load) throw new Error('Oxe.router.add - load required');

            // if (!data.name && !data.load && !data.component) {
            //     throw new Error('Oxe.router.add - route requires name and load property');
            // }

            this.data.push(data);
        }
    };

    const load$1 = async function (route) {

        if (route.load && !route.component) {
            const load$1 = await load(route.load);
            route.component = load$1.default;
        }

        // if (route.load) {
        //     const load = await Load(route.load);
        //     route = { ...load.default, ...route };
        // }

        // if (typeof route.component === 'string') {
        //     route.load = route.component;
        //     const load = await Load(route.load);
        //     route.component = load.default;
        // }

        return route;
    };

    const remove$1 = async function (path) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data.splice(i, 1);
            }
        }
    };

    const get$1 = async function (path) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data[i] = await this.load(this.data[i]);
                return this.data[i];
            }
        }
    };

    const filter = async function (path) {
        const result = [];

        for (let i = 0; i < this.data.length; i++) {
            if (this.compare(this.data[i].path, path)) {
                this.data[i] = await this.load(this.data[i]);
                result.push(this.data[i]);
            }
        }

        return result;
    };

    const find = async function (path) {
        // for (let i = 0; i < this.data.length; i++) {
        //     if (this.data[i].path === path) {
        //     // if (this.compare(this.data[i].path, path)) {
        //         this.data[i] = await this.load(this.data[i]);
        //         return this.data[i];
        //     }
        // }

        let name;
        if (path === '/') name = 'r-index';
        else if (path.endsWith('/')) name = `r-${basename(path)}-index`;

        const cache = this.data.find(route => route.path === path);
        if (cache) return this.load(cache);

        let load = path;
        load = load.charAt(0) === '/' ? load.slice(1) : load;
        load = load.charAt(load.length-1) === '/' ? load.slice(0, load.length-1) : load;
        load = load.split('/');
        load.splice(-1, 1, 'default.js');
        load.unshift(self.folder);
        load = load.join('/');

        const route = await this.load({ path, name, load });
        this.data.push(route);
        return route;
    };

    const render = async function (route) {

        if (!route) {
            throw new Error('Oxe.router.render - route required');
        }

        if (!route.target) {
            if (!route.name) throw new Error('Oxe.router.render - name required');
            if (!route.component) throw new Error('Oxe.router.render - component required');
            Define(route.name, route.component);
            route.target = window.document.createElement(route.name);
        }

        window.document.title = route.component.title || route.target.title || route.target.model.title;

        if (self.target) {

            while (self.target.firstChild) {
                self.target.removeChild(self.target.firstChild);
            }

            self.target.appendChild(route.target);

        }

        window.scroll(0, 0);
    };

    const route = async function (path, options = {}) {

        if (options.query) {
            path += Query(options.query);
        }

        const location = Location(path);
        const mode = options.mode || self.mode;

        const route = await this.find(location.pathname);

        if (!route) {
            throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
        }

        if (typeof self.before === 'function') {
            await self.before(location);
        }

        if (route.handler) {
            return route.handler(location);
        }

        if (route.redirect) {
            return this.redirect(route.redirect);
        }

        Events(self.target, 'before', location);

        if (mode === 'href') {
            return window.location.assign(location.path);
        }

        window.history[mode + 'State']({ path: location.path }, '', location.path);

        if (route.title) {
            window.document.title = route.title;
        }

        await this.render(route);

        if (typeof self.after === 'function') {
            await self.after(location);
        }

        Events(self.target, 'after', location);
    };

    const state = async function (event) {
        const path = event && event.state ? event.state.path : window.location.href;
        this.route(path, { mode: 'replace' });
    };

    const click = async function (event) {

        // ignore canceled events, modified clicks, and right clicks
        if (
            event.target.type ||
            event.button !== 0 ||
            event.defaultPrevented ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        ) return;

        // if shadow dom use
        let target = event.path ? event.path[0] : event.target;
        let parent = target.parentElement;

        if (self.contain) {

            while (parent) {

                if (parent.nodeName === self.target.nodeName) {
                    break;
                } else {
                    parent = parent.parentElement;
                }

            }

            if (parent.nodeName !== self.target.nodeName) {
                return;
            }

        }

        while (target && 'A' !== target.nodeName) {
            target = target.parentElement;
        }

        if (!target || 'A' !== target.nodeName) {
            return;
        }

        // check non-acceptables
        const tel = 'tel:';
        const ftp = 'ftp:';
        const file = 'file:';
        const mailto = 'mailto:';

        if (target.hasAttribute('download') ||
            target.hasAttribute('external') ||
            target.hasAttribute('o-external') ||
            target.href.slice(0, tel.length) === tel ||
            target.href.slice(0, ftp.length) === ftp ||
            target.href.slice(0, file.length) === file ||
            target.href.slice(0, mailto.length) === mailto ||
            target.href.slice(window.location.origin) !== 0 ||
            (target.hash !== '' &&
                target.origin === window.location.origin &&
                target.pathname === window.location.pathname)
        ) return;

        // if external is true then default action
        if (self.external &&
            (self.external.constructor === RegExp && self.external.test(target.href) ||
                self.external.constructor === Function && self.external(target.href) ||
                self.external.constructor === String && self.external === target.href)
        ) return;

        event.preventDefault();

        // if (this.location.href !== target.href) {
        this.route(target.href);
        // }

    };

    var Router = Object.freeze({
        data,
        setup: setup$1, compareParts, compare,
        scroll, back, forward, redirect,
        add, get: get$1, find, remove: remove$1, filter,
        route, render, load: load$1,
        state, click
    });

    const text = ':not(:defined) { visibility: hidden; }';
    const style = document.createElement('style');
    const node = document.createTextNode(text);
    const sheet = style.sheet;

    style.setAttribute('title', 'oxe');
    style.setAttribute('type', 'text/css');
    style.appendChild(node);

    // o-router, o-router > :first-child { display: block; }

    document.head.appendChild(style);

    const transform$1 = function (data) {

        if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
            const matches = data.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];

            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
                const pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
                data = data.replace(rule[0], '');
                data = data.replace(pattern, rule[2]);
            }

        }

        return data;
    };

    const add$1 = function (data) {
        data = transform$1(data);
        sheet.insertRule(data);
    };

    const append = function (data) {
        data = transform$1(data);
        style.appendChild(document.createTextNode(data));
    };

    const setup$2 = async function (option = {}) {

        if (option.style) {
            append(option.style);
        }

    };

    var Style$1 = Object.freeze({
        style, sheet, add: add$1, append, setup: setup$2
    });

    if (typeof window.CustomEvent !== 'function') {
        window.CustomEvent = function CustomEvent (event, options) {
            options = options || { bubbles: false, cancelable: false, detail: null };
            var customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
            return customEvent;
        };
    }

    if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
        window.Reflect = window.Reflect || {};
        window.Reflect.construct = function construct (parent, args, child) {
            var target = child === undefined ? parent : child;
            var prototype = Object.create(target.prototype || Object.prototype);
            return Function.prototype.apply.call(parent, prototype, args) || prototype;
        };
    }

    const setup$3 = document.querySelector('script[o-setup]');
    const url = setup$3 ? setup$3.getAttribute('o-setup') : '';
    if (setup$3) load(url);

    let SETUP = false;

    var index = Object.freeze({

        Component, component: Component,
        Location, location: Location,
        Batcher, batcher: Batcher,
        Fetcher, fetcher: Fetcher,
        Router, router: Router,
        Binder: Binder$1, binder: Binder$1,
        Define, define: Define,
        Class: Class$1, class: Class$1,
        Query, query: Query,
        Style: Style$1, style: Style$1,
        Load: load, load: load,

        setup (options = {}) {

            if (SETUP) return;
            else SETUP = true;

            options.listener = options.listener || {};

            // if (document.currentScript) {
            //     options.base = document.currentScript.src.replace(window.location.origin, '');
            // } else if (url) {
            //     const a = document.createElement('a');
            //     a.setAttribute('href', url);
            //     options.base = a.pathname;
            // }

            // options.base = options.base ? options.base.replace(/\/*\w*.js$/, '') : '/';
            // options.loader.base = options.base;
            // options.router.base = options.base;
            // options.component.base = options.base;

            return Promise.all([
                this.style.setup(options.style),
                this.binder.setup(options.binder),
                // this.loader.setup(options.loader),
                this.fetcher.setup(options.fetcher)
            ]).then(() => {
                if (options.listener.before) {
                    return options.listener.before();
                }
            }).then(() => {
                if (options.router) {
                    return this.router.setup(options.router);
                }
            }).then(() => {
                if (options.listener.after) {
                    return options.listener.after();
                }
            });
        }

    });

    return index;

})));
