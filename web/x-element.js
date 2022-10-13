// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const Cache = new WeakMap();
const ContextResolve = async function(item, method) {
    await Promise.resolve(item).then(method);
};
const ContextEvent = async function([binders, path]) {
    const parents = [];
    const children = [];
    let key, value, binder;
    for ([key, value] of binders){
        if (value) {
            if (key === path) {
                for (binder of value){
                    parents.push(binder);
                }
            } else if (key?.startsWith?.(`${path}.`)) {
                for (binder of value){
                    children.push(binder);
                }
            }
        }
    }
    await Promise.all(parents.map(async (binder)=>await binder.render?.(binder)));
    await Promise.all(children.map(async (binder)=>await binder.render?.(binder)));
};
const ContextSet = function(binders, path, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && typeof from === 'object') {
        Cache.delete(from);
    }
    Reflect.set(target, key, value, receiver);
    path = path ? `${path}.${key}` : key;
    ContextResolve([
        binders,
        path
    ], ContextEvent);
    return true;
};
const ContextGet = function(binders, path, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key);
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : key;
        const cache = Cache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, binders, path),
            set: ContextSet.bind(null, binders, path)
        });
        Cache.set(value, proxy);
        return proxy;
    }
    return value;
};
const ContextCreate = function(data, binders, path = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, binders, path),
        set: ContextSet.bind(null, binders, path)
    });
};
const Cache1 = new Map();
const Compute = function(value) {
    const cache = Cache1.get(value);
    if (cache) return cache;
    const code = `
    with ($context) {
        with ($instance) {
            return (${value});
        }
    }
    `;
    const method = new Function('$context', '$instance', code);
    Cache1.set(value, method);
    return method;
};
const IgnoreString = `
(\\b
(\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
event|this|window|document|console|location|navigation|
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
true|false|null|of|in|do|if|for|new|try|case|else|with|async|await|break|catch|class|super|throw|while|
yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
((\\??\\.)[a-zA-Z0-9$_.? ]*)?
\\b)
`.replace(/\t|\n/g, '');
const IgnorePattern = new RegExp(IgnoreString, 'g');
const ReferencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const StringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const RegularFunctionPattern = /function\s*\([a-zA-Z0-9$_,]*\)/g;
const ArrowFunctionPattern = /(\([a-zA-Z0-9$_,]*\)|[a-zA-Z0-9$_]+)\s*=>/g;
const ReferenceNormalize = /\s*(\s*\??\.?\s*\[\s*([0-9]+)\s*\]\s*\??(\.?)\s*|\?\.)\s*/g;
const Cache2 = new Map();
const Paths = function(value) {
    const cache = Cache2.get(value);
    if (cache) return cache;
    const clean = value.replace(StringPattern, '').replace(ArrowFunctionPattern, '').replace(RegularFunctionPattern, '');
    const paths = clean.replace(IgnorePattern, '').replace(ReferenceNormalize, '.$2$3').match(ReferencePattern) ?? [];
    Cache2.set(value, paths);
    return paths;
};
const parseable = function(value) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};
const display = function(data) {
    if (typeof data == 'string') return data;
    if (typeof data == 'undefined') return '';
    if (typeof data == 'object') return JSON.stringify(data);
    return data;
};
const dash = function(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
};
const toolDefault = Object.freeze({
    parseable,
    display,
    dash
});
const booleanDefault = Object.freeze([
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'compact',
    'controls',
    'declare',
    'default',
    'defaultchecked',
    'defaultmuted',
    'defaultselected',
    'defer',
    'disabled',
    'draggable',
    'enabled',
    'formnovalidate',
    'indeterminate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nohref',
    'noresize',
    'noshade',
    'hidden',
    'novalidate',
    'nowrap',
    'open',
    'pauseonexit',
    'readonly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'selected',
    'sortable',
    'spellcheck',
    'translate',
    'truespeed',
    'typemustmatch',
    'visible', 
]);
const standardSetup = function(binder) {
    binder.meta.boolean = booleanDefault.includes(binder.name);
};
const standardRender = async function(binder) {
    if (binder.name == 'text') {
        const data = await binder.compute();
        binder.owner.textContent = toolDefault.display(data);
    } else if (binder.meta.boolean) {
        const data1 = await binder.compute() ? true : false;
        if (data1) binder.owner.setAttribute(binder.name, '');
        else binder.owner.removeAttribute(binder.name);
    } else {
        let data2 = await binder.compute();
        data2 = toolDefault.display(data2);
        binder.owner[binder.name] = data2;
        binder.owner.setAttribute(binder.name, data2 ?? '');
    }
};
const standardReset = function(binder) {
    if (binder.name == 'text') {
        binder.owner.textContent = '';
    } else if (binder.meta.boolean) {
        binder.owner.removeAttribute(binder.name);
    } else {
        binder.owner[binder.name] = undefined;
        binder.owner?.setAttribute(binder.name, '');
    }
};
const standardDefault = {
    setup: standardSetup,
    render: standardRender,
    reset: standardReset
};
const checkedHandler = async function(binder, event) {
    binder.instance.event = event;
    binder.instance.$checked = event ? binder.owner.checked : undefined;
    const computed = await binder.compute();
    if (computed) {
        binder.owner.checked = true;
        binder.owner.setAttribute('checked', '');
    } else {
        binder.owner.checked = false;
        binder.owner.removeAttribute('checked');
    }
};
const checkedSetup = function(binder) {
    if (binder.owner.type === 'radio') {
        binder.owner.addEventListener('input', async function checkInput(event) {
            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
            await checkedHandler(binder, event);
            for (const radio of radios){
                if (radio === event.target) continue;
                if (radio?.x?.checked) {
                    checkedHandler(radio.x.checked, new Event('input'));
                } else {
                    radio.checked = false;
                    radio.removeAttribute('checked');
                }
            }
        });
    } else {
        binder.owner.addEventListener('input', function checkInput(event) {
            checkedHandler(binder, event);
        });
    }
};
const checkedRender = async function(binder) {
    await checkedHandler(binder);
};
const checkedReset = function(binder) {
    binder.owner.checked = undefined;
    binder.owner.removeAttribute('checked');
};
const checkedDefault = {
    setup: checkedSetup,
    render: checkedRender,
    reset: checkedReset
};
const inheritSetup = function(binder) {};
const inheritRender = async function(binder) {
    if (typeof binder.owner.inherited !== 'function') {
        return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }
    const inherited = await binder.compute();
    await binder.owner.inherited(inherited);
};
const inheritReset = async function(binder) {
    if (typeof binder.owner.inherited !== 'function') {
        return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
    }
    await binder.owner.inherited?.();
};
const inheritDefault = {
    setup: inheritSetup,
    render: inheritRender,
    reset: inheritReset
};
const dateDefault = Object.freeze([
    'datetime-local',
    'date',
    'month',
    'time',
    'week', 
]);
const valueEvent = new Event('input');
const valueInput = async function(binder, event) {
    if (binder.meta.busy) return;
    binder.meta.busy = true;
    binder.instance.event = event;
    const type = binder.owner.type;
    if (type === 'select-one') {
        const option = binder.owner.selectedOptions[0];
        if (option) {
            if (option.x.value) {
                binder.instance.$value = option.x.value.meta.value;
            } else {
                binder.instance.$value = option.value;
            }
        } else {
            binder.instance.$value = undefined;
        }
    } else if (type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(binder.owner.selectedOptions, (option)=>option.x ? option.x.value.meta.value : option.value);
    } else if (type === 'number' || type === 'range' || dateDefault.includes(type)) {
        if (typeof binder.meta.value === 'number') {
            binder.instance.$value = binder.owner.valueAsNumber;
        } else {
            binder.instance.$value = binder.owner.value;
        }
    } else if (binder.owner.nodeName == 'OPTION') {
        throw 'option event';
    } else {
        if (toolDefault.parseable(binder.meta.value)) {
            binder.instance.$value = JSON.parse(binder.owner.value);
        } else {
            binder.instance.$value = binder.owner.value;
        }
    }
    const computed = await binder.compute();
    const display = toolDefault.display(computed);
    binder.meta.busy = false;
    binder.meta.value = computed;
    binder.owner.value = display;
    binder.instance.event = undefined;
    binder.owner.setAttribute('value', display);
};
const valueSetup = function(binder) {
    binder.meta.value = undefined;
    binder.owner.addEventListener('input', (event)=>valueInput(binder, event));
};
const valueRender = async function(binder) {
    if (binder.meta.busy) return;
    binder.meta.busy = true;
    binder.instance.event = undefined;
    const computed = await binder.compute();
    let display;
    if (binder.owner.type === 'select-one') {
        for(let i = 0; i < binder.owner.options.length; i++){
            const option = binder.owner.options[i];
            option.selected = option.x.value ? option.x.value.meta.value === computed : option.value === computed;
        }
        if (computed === undefined && binder.owner.options.length && !binder.owner.selectedOptions.length) {
            binder.owner.options[0].selected = true;
            binder.owner.dispatchEvent(valueEvent);
            return;
        }
        display = toolDefault.display(computed);
    } else if (binder.owner.type === 'select-multiple') {
        for(let i1 = 0; i1 < binder.owner.options.length; i1++){
            const option1 = binder.owner.options[i1];
            option1.selected = computed?.includes(option1.x ? option1.x.value.meta.value : option1.value);
        }
        display = toolDefault.display(computed);
    } else if (binder.owner.type === 'number' || binder.owner.type === 'range' || dateDefault.includes(binder.owner.type)) {
        if (typeof computed === 'string') binder.owner.value = computed;
        else if (typeof computed === 'number' && !isNaN(computed)) binder.owner.valueAsNumber = computed;
        else binder.owner.value = '';
        display = binder.owner.value;
    } else {
        display = toolDefault.display(computed);
        binder.owner.value = display;
    }
    binder.meta.busy = false;
    binder.meta.value = computed;
    binder.instance.event = undefined;
    binder.owner.setAttribute('value', display);
};
const valueReset = function(binder) {
    if (binder.meta.busy) return;
    binder.meta.busy = true;
    if (binder.owner.type === 'select-one' || binder.owner.type === 'select-multiple') {
        for (const option of binder.owner.options){
            option.selected = false;
        }
    }
    binder.meta.busy = false;
    binder.owner.value = null;
    binder.meta.value = undefined;
    binder.owner.setAttribute('value', '');
};
const valueDefault = {
    setup: valueSetup,
    render: valueRender,
    reset: valueReset
};
const onSetup = function(binder) {
    binder.meta.name = binder.name.slice(2);
};
const onRender = function(binder) {
    if (binder.meta.method) {
        binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
    binder.meta.method = async (event)=>{
        let result;
        binder.instance.event = event;
        result = await binder.compute();
        binder.instance.event = undefined;
        return result;
    };
    binder.owner.addEventListener(binder.meta.name, binder.meta.method);
};
const onReset = function(binder) {
    if (binder.meta.method) {
        binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
};
const onDefault = {
    setup: onSetup,
    render: onRender,
    reset: onReset
};
const BinderSyntaxLength = 2;
const BinderSyntaxEnd = '}}';
const BinderSyntaxStart = '{{';
const BinderText = Node.TEXT_NODE;
const BinderElement = Node.ELEMENT_NODE;
const BinderAttribute = Node.ATTRIBUTE_NODE;
const BinderFragment = Node.DOCUMENT_FRAGMENT_NODE;
const htmlRender = async function(binder) {
    const data = await binder.compute();
    const tasks = [];
    let fragment;
    if (typeof data == 'string') {
        const template = document.createElement('template');
        template.innerHTML = data;
        fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
        fragment = data.content.cloneNode(true);
    } else {
        return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
    }
    let node = binder.owner.lastChild;
    while(node){
        binder.owner.removeChild(node);
        node = binder.owner.lastChild;
    }
    let element = fragment.firstChild;
    while(element){
        tasks.push(BinderHandle(binder.context, binder.binders, binder.rewrites, element));
        element = element.nextSibling;
    }
    await Promise.all(tasks);
    binder.owner.appendChild(fragment);
};
const htmlReset = function(binder) {
    let node = binder.owner.lastChild;
    while(node){
        binder.owner.removeChild(node);
        node = binder.owner.lastChild;
    }
};
const htmlDefault = {
    render: htmlRender,
    reset: htmlReset
};
const eachWhitespace = /\s+/;
const eachText = Node.TEXT_NODE;
const eachSetup = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');
    let node = binder.owner.firstChild;
    while(node){
        if (node.nodeType === eachText && eachWhitespace.test(node.nodeValue)) {
            binder.owner.removeChild(node);
        } else {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
        }
        node = binder.owner.firstChild;
    }
};
const BinderHandle = async function(context, binders, rewrites, node) {
    const type = node.nodeType;
    const bindings = [];
    const handles = [];
    if (type === BinderFragment) {
        let child = node.firstChild;
        while(child){
            handles.push(BinderHandle(context, binders, rewrites, child));
            child = child.nextSibling;
        }
    } else if (type === BinderText) {
        const start = node.nodeValue?.indexOf(BinderSyntaxStart) ?? -1;
        if (start === -1) return;
        if (start !== 0) node = node.splitText(start);
        const end = node.nodeValue?.indexOf(BinderSyntaxEnd) ?? -1;
        if (end === -1) return;
        if (end + 2 !== node.nodeValue?.length) {
            handles.push(BinderHandle(context, binders, rewrites, node.splitText(end + 2)));
            bindings.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''));
        } else {
            bindings.push(BinderCreate(context, binders, rewrites, node, BinderText, 'text', node.nodeValue ?? ''), type);
        }
    } else if (type === BinderElement) {
        let each = false;
        const attributes = [
            ...node.attributes
        ];
        for (const attribute of attributes){
            const { name , value  } = attribute;
            if (value.startsWith(BinderSyntaxStart) && value.endsWith(BinderSyntaxEnd)) {
                each = name === 'each' || name === 'x-each';
                bindings.push(BinderCreate(context, binders, rewrites, attribute, BinderAttribute, name, value));
            }
        }
        if (!each) {
            let child1 = node.firstChild;
            while(child1){
                handles.push(BinderHandle(context, binders, rewrites, child1));
                child1 = child1.nextSibling;
            }
        }
    }
    await Promise.all(bindings);
    await Promise.all(handles);
};
const eachRender = async function(binder) {
    if (binder.meta.busy) console.log(binder);
    if (binder.meta.busy) return;
    else binder.meta.busy = true;
    const tasks = [];
    const [path] = binder.paths;
    const [data, variable, key, index] = await binder.compute();
    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variable = variable;
    binder.meta.path = path;
    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else if (data?.constructor === Object) {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    } else {
        return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
    }
    console.time('each render');
    if (binder.meta.currentLength > binder.meta.targetLength) {
        while(binder.meta.currentLength > binder.meta.targetLength){
            let count = binder.meta.templateLength, node;
            while(count--){
                node = binder.owner.lastChild;
                if (node) {
                    binder.owner.removeChild(node);
                }
            }
            binder.meta.currentLength--;
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {}
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, context, rewrites;
        while(binder.meta.currentLength < binder.meta.targetLength){
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;
            rewrites = [
                ...binder.rewrites,
                [
                    binder.meta.variable,
                    `${binder.meta.path}.${keyValue}`
                ], 
            ];
            context = new Proxy(binder.context, {
                has: function eachHas(target, key) {
                    if (key === binder.meta.keyName) return true;
                    if (key === binder.meta.indexName) return true;
                    if (key === binder.meta.variable) return true;
                    return Reflect.has(target, key);
                },
                get: function eachGet(target, key, receiver) {
                    if (key === binder.meta.keyName) return keyValue;
                    if (key === binder.meta.indexName) return indexValue;
                    if (key === binder.meta.variable) return Reflect.get(binder.meta.data, keyValue, receiver);
                    return Reflect.get(target, key, receiver);
                },
                set: function eachSet(target, key, value, receiver) {
                    if (key === binder.meta.keyName) return true;
                    if (key === binder.meta.indexName) return true;
                    if (key === binder.meta.variable) return Reflect.set(binder.meta.data, keyValue, value, receiver);
                    return Reflect.set(target, key, value, receiver);
                }
            });
            let node1 = binder.meta.templateElement.content.firstChild;
            while(node1){
                clone = node1.cloneNode(true);
                tasks.push(BinderHandle(context, binder.binders, rewrites, clone));
                binder.meta.queueElement.content.appendChild(clone);
                node1 = node1.nextSibling;
            }
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            await Promise.all(tasks);
            binder.owner.appendChild(binder.meta.queueElement.content);
        }
    }
    binder.meta.busy = false;
    console.timeEnd('each render');
};
const eachReset = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    while(binder.meta.queueElement.content.lastChild)binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
};
const eachDefault = {
    setup: eachSetup,
    render: eachRender,
    reset: eachReset
};
const BinderCreate = async function(context, binders, rewrites, node, type, name, value) {
    name = name ?? '';
    value = value ?? '';
    const owner = node.ownerElement ?? node;
    if (type === BinderAttribute) {
        node.ownerElement.removeAttributeNode(node);
        name = name.startsWith('x-') ? name.slice(2) : name;
    }
    if (type === BinderText) {
        node.textContent = '';
    }
    if (value.startsWith(BinderSyntaxStart) && value.endsWith(BinderSyntaxEnd)) {
        value = value.slice(BinderSyntaxLength, -BinderSyntaxLength);
    }
    let handler;
    if (name === 'html') handler = htmlDefault;
    else if (name === 'each') handler = eachDefault;
    else if (name === 'value') handler = valueDefault;
    else if (name === 'text') handler = standardDefault;
    else if (name === 'checked') handler = checkedDefault;
    else if (name === 'inherit') handler = inheritDefault;
    else if (name?.startsWith('on')) handler = onDefault;
    else handler = standardDefault;
    const binder = {
        name,
        value,
        owner,
        binders,
        context,
        rewrites,
        meta: {},
        instance: {},
        paths: Paths(value),
        compute: Compute(value),
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render
    };
    binder.reset = binder.reset.bind(null, binder);
    binder.render = binder.render.bind(null, binder);
    binder.setup = binder?.setup?.bind(null, binder);
    binder.compute = binder.compute.bind(binder.owner, binder.context, binder.instance);
    let path, from, to;
    for (path of binder.paths){
        for ([from, to] of rewrites){
            if (path === from) {
                path = to;
            } else if (path.startsWith(from + '.')) {
                path = to + path.slice(from.length);
            }
        }
        if (binders.has(path)) {
            binders.get(path)?.add(binder);
        } else {
            binders.set(path, new Set([
                binder
            ]));
        }
    }
    binder.owner.x = binder.owner.x ?? {};
    binder.owner.x[name] = binder;
    binder.setup?.(binder);
    await binder.render(binder);
    return binder;
};
const navigators = new Map();
const transition = async function(options) {
    if (!options.target) throw new Error('XElement - navigation target option required');
    if (options.cache && options.instance) return options.target.replaceChildren(options.instance);
    if (options.navigating) return;
    else options.navigating = true;
    if (!options.file) throw new Error('XElement - navigation file option required');
    options.construct = options.construct ?? (await import(options.file)).default;
    if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');
    options.name = options.name ?? dash(options.construct.name);
    if (!/^\w+-\w+/.test(options.name)) options.name = `x-${options.name}`;
    if (!customElements.get(options.name)) customElements.define(options.name, options.construct);
    options.instance = document.createElement(options.name);
    options.target.replaceChildren(options.instance);
    options.navigating = false;
};
const navigate = function(event) {
    if (event && ('canTransition' in event && !event.canTransition || 'canIntercept' in event && !event.canIntercept)) return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const options = navigators.get(pathname) ?? navigators.get('/*');
    if (!options) return;
    options.target = options.target ?? document.querySelector(options.query);
    if (!options.target) throw new Error('XElement - navigation target not found');
    if (event?.intercept) {
        if (options.instance === options.target.lastElementChild) return event.intercept();
        return event.intercept({
            handler: ()=>transition(options)
        });
    } else if (event?.transitionWhile) {
        if (options.instance === options.target.lastElementChild) return event.transitionWhile((()=>undefined)());
        return event.transitionWhile(transition(options));
    } else {
        transition(options);
    }
};
function navigation(path, file, options = {}) {
    if (!path) throw new Error('XElement - navigation path required');
    if (!file) throw new Error('XElement - navigation file required');
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    options.path = path;
    options.cache = options.cache ?? true;
    options.query = options.query ?? 'main';
    options.file = new URL(file, base.href).href;
    navigators.set(path, options);
    navigate();
    window.navigation.addEventListener('navigate', navigate);
}
class XElement extends HTMLElement {
    static observedProperties;
    static navigation = navigation;
    static syntaxLength = 2;
    static syntaxEnd = '}}';
    static syntaxStart = '{{';
    static syntaxMatch = new RegExp('{{.*?}}');
    static adoptedEvent = new Event('adopted');
    static adoptingEvent = new Event('adopting');
    static preparedEvent = new Event('prepared');
    static preparingEvent = new Event('preparing');
    static connectedEvent = new Event('connected');
    static connectingEvent = new Event('connecting');
    static attributedEvent = new Event('attributed');
    static attributingEvent = new Event('attributing');
    static disconnectedEvent = new Event('disconnected');
    static disconnectingEvent = new Event('disconnecting');
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }
    get isPrepared() {
        return this.#prepared;
    }
    #prepared = false;
    #preparing = false;
    #rewrites = [];
    #binders = new Map();
    #context = ContextCreate({}, this.#binders);
    get b() {
        return this.#binders;
    }
    get c() {
        return this.#context;
    }
    constructor(){
        super();
        if (!this.shadowRoot) this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot?.addEventListener('slotchange', this.slottedCallback.bind(this));
    }
    async prepare() {
        if (this.#prepared) return;
        if (this.#preparing) return new Promise((resolve)=>this.addEventListener('preparing', ()=>resolve(undefined)));
        this.#preparing = true;
        this.dispatchEvent(XElement.preparingEvent);
        const prototype = Object.getPrototypeOf(this);
        const descriptors = {};
        const properties = this.constructor.observedProperties;
        if (properties) {
            properties.forEach((property)=>descriptors[property] = Object.getOwnPropertyDescriptor(this, property) ?? {});
        } else {
            Object.assign(descriptors, Object.getOwnPropertyDescriptors(this));
            Object.assign(descriptors, Object.getOwnPropertyDescriptors(prototype));
        }
        for(const property in descriptors){
            if ('attributeChangedCallback' === property || 'disconnectedCallback' === property || 'connectedCallback' === property || 'adoptedCallback' === property || 'disconnected' === property || 'constructor' === property || 'attributed' === property || 'connected' === property || 'adopted' === property || property.startsWith('#')) continue;
            const descriptor = descriptors[property];
            if (!descriptor.configurable) continue;
            if (descriptor.set) descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value.bind(this);
            Object.defineProperty(this.#context, property, descriptor);
            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable,
                get: ()=>this.#context[property],
                set: (value)=>this.#context[property] = value
            });
        }
        const promises = [];
        let child = this.shadowRoot?.firstChild;
        while(child){
            promises.push(BinderHandle(this.#context, this.#binders, this.#rewrites, child));
            child = child.nextSibling;
        }
        const slots = this.shadowRoot?.querySelectorAll('slot') ?? [];
        for (const slot of slots){
            const nodes = slot.assignedNodes();
            for (const node of nodes){
                promises.push(BinderHandle(this.#context, this.#binders, this.#rewrites, node));
            }
        }
        await Promise.all(promises);
        this.#prepared = true;
        this.#preparing = false;
        this.dispatchEvent(XElement.preparedEvent);
    }
    async slottedCallback(event) {
        console.log('slottedCallback');
        await this.slotted?.();
    }
    async connectedCallback() {
        await this.prepare();
        this.dispatchEvent(XElement.connectingEvent);
        await this.connected?.();
        this.dispatchEvent(XElement.connectedEvent);
    }
    async disconnectedCallback() {
        this.dispatchEvent(XElement.disconnectingEvent);
        await this.disconnected?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }
    async adoptedCallback() {
        this.dispatchEvent(XElement.adoptingEvent);
        await this.adopted?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }
    async attributeChangedCallback(name, from, to) {
        this.dispatchEvent(XElement.attributingEvent);
        await this.attributed?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }
}
export { XElement as default };
