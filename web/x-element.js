// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ComputeNext = Promise.resolve();
const ComputeCache = new Map();
const Compute = async function(value) {
    await ComputeNext;
    const cache = ComputeCache.get(value);
    if (cache) return cache;
    const code = `
        with ($context) {
            with ($instance) {
                return (${value});
            }
        }
        `;
    const method = new Function('$context', '$instance', code);
    ComputeCache.set(value, method);
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
const PathsNext = Promise.resolve();
const PathsCache = new Map();
const Paths = async function(value) {
    await PathsNext;
    const cache = PathsCache.get(value);
    if (cache) return [
        ...cache
    ];
    const clean = value.replace(StringPattern, '').replace(ArrowFunctionPattern, '').replace(RegularFunctionPattern, '');
    const paths = clean.replace(IgnorePattern, '').replace(ReferenceNormalize, '.$2$3').match(ReferencePattern) ?? [];
    PathsCache.set(value, paths);
    return [
        ...paths
    ];
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
const checkedEvent = new Event('input');
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
        binder.owner.addEventListener('input', async function checkedInput(event) {
            await checkedHandler(binder, event);
            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
            for (const radio of radios){
                if (radio === event.target) continue;
                radio.checked = false;
                radio.removeAttribute('checked');
                if (radio?.x?.checked) {
                    checkedHandler(radio.x.checked, checkedEvent);
                }
            }
        });
    } else {
        binder.owner.addEventListener('input', function checkedInput(event) {
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
    const { owner , instance  } = binder;
    let value;
    const type = binder.meta.type;
    if (type === 'select-one') {
        value = undefined;
        const option = owner.selectedOptions[0];
        if (option?.x?.value) {
            await option.x.value.promise;
            value = option.x.value.instance.$value;
        } else if (option) {
            value = option.value;
        }
    } else if (type === 'select-multiple') {
        value = [];
        for (const option1 of owner.selectedOptions){
            if (option1?.x?.value) {
                await option1.x.value.promise;
                value?.push?.(option1.x.value.instance.$value);
            } else {
                value?.push?.(option1.value);
            }
        }
    } else if (type === 'number' || type === 'range' || dateDefault.includes(type)) {
        if (typeof instance.$value === 'number') {
            value = owner.valueAsNumber;
        } else {
            value = owner.value;
        }
    } else {
        value = owner.value;
    }
    instance.$value = value;
    instance.$event = event;
    instance.event = event;
    value = await binder.compute();
    instance.$value = value;
    instance.event = undefined;
    instance.$event = undefined;
    owner.setAttribute('value', JSON.stringify(value));
};
const valueSetup = function(binder) {
    binder.owner.value = '';
    binder.instance.$value = undefined;
    binder.meta.type = binder.owner.type;
    binder.owner.addEventListener('input', (event)=>valueInput(binder, event));
};
const valueRender = async function(binder) {
    const { owner , instance  } = binder;
    instance.event = undefined;
    instance.$value = undefined;
    instance.$event = undefined;
    const value = await binder.compute();
    instance.$value = value;
    instance.event = undefined;
    instance.$event = undefined;
    const type = binder.meta.type;
    if (type === 'select-one') {
        await owner?.x?.each?.promise;
        for(let i = 0; i < owner.options.length; i++){
            const option = owner.options[i];
            if (option?.x?.value) {
                await option.x.value.promise;
                option.selected = option.x.value.instance.$value === value;
            } else {
                option.selected = option.value === value;
            }
        }
        if (value === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[0].selected = true;
            owner.dispatchEvent(valueEvent);
            return;
        }
    } else if (type === 'select-multiple') {
        await owner?.x?.each?.promise;
        for(let i1 = 0; i1 < owner.options.length; i1++){
            const option1 = owner.options[i1];
            if (option1?.x?.value) {
                await option1.x.value.promise;
                option1.selected = value?.includes(option1.x.value.instance.$value);
            } else {
                option1.selected = value?.includes(option1.value);
            }
        }
    } else if (type === 'number' || type === 'range' || dateDefault.includes(type)) {
        if (typeof value === 'string') owner.value = value;
        else if (typeof value === 'number') owner.valueAsNumber = value || 0;
        else owner.value = undefined;
    } else {
        owner.value = value ?? '';
    }
    owner.setAttribute('value', toolDefault.display(value));
};
const valueReset = function(binder) {
    const type = binder.meta.type;
    const { owner , instance  } = binder;
    if (type === 'select-one' || type === 'select-multiple') {
        for (const option of owner.options){
            option.selected = false;
        }
    }
    owner.value = null;
    instance.event = undefined;
    instance.$event = undefined;
    instance.$value = undefined;
    owner.setAttribute('value', '');
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
const BinderSpace = /^\s*$/;
const BinderSyntaxLength = 2;
const BinderSyntaxOpen = '{{';
const BinderSyntaxClose = '}}';
const BinderSyntaxAttribute = 'x-';
const BinderText = Node.TEXT_NODE;
const BinderElement = Node.ELEMENT_NODE;
const BinderFragment = Node.DOCUMENT_FRAGMENT_NODE;
const BinderNext = Promise.resolve();
const BinderCreate = async function(context, binders, rewrites, node, name, value) {
    await BinderNext;
    if (value.startsWith(BinderSyntaxOpen) && value.endsWith(BinderSyntaxClose)) {
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
    const [paths, compute] = await Promise.all([
        Paths(value),
        Compute(value), 
    ]);
    const binder = {
        name,
        value,
        binders,
        context,
        rewrites,
        paths,
        compute,
        meta: {},
        instance: {},
        owner: node,
        setup: handler.setup,
        resets: Promise.resolve(),
        renders: Promise.resolve(),
        reset () {
            return binder.resets = binder.resets.then(function resetPromise() {
                return handler.reset(binder);
            });
        },
        render () {
            return binder.renders = binder.renders.then(function renderPromise() {
                return handler.render(binder);
            });
        }
    };
    binder.setup = binder?.setup?.bind(null, binder);
    binder.compute = binder.compute.bind(binder.owner, binder.context, binder.instance);
    let path, from, to, i;
    const l = binder.paths.length;
    for(i = 0; i < l; i++){
        path = binder.paths[i];
        for ([from, to] of rewrites){
            if (path === from) {
                binder.paths[i] = path = to;
            } else if (path.startsWith(from + '.')) {
                binder.paths[i] = path = to + path.slice(from.length);
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
    if (Reflect.has(binder.owner, 'x')) {
        Reflect.set(binder.owner.x, name, binder);
    } else {
        Reflect.defineProperty(binder.owner, 'x', {
            value: {
                [name]: binder
            }
        });
    }
    await binder.setup?.(binder);
    await binder.render();
    return binder;
};
const BinderAdd = async function(context, binders, rewrites, root, first, last) {
    let node;
    const promises = [];
    const walker = document.createTreeWalker(root, 5);
    if (first) {
        node = walker.currentNode = first;
    } else if (walker.currentNode.nodeType === BinderFragment) {
        node = walker.nextNode();
    } else {
        node = walker.currentNode;
    }
    let name, value;
    while(node){
        if (Reflect.has(node, 'x')) {
            if (first !== last && node === last) break;
            node = walker.nextSibling();
            continue;
        } else if (node.nodeType === BinderText) {
            if (!node.nodeValue || BinderSpace.test(node.nodeValue)) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }
            const open = node.nodeValue.indexOf(BinderSyntaxOpen) ?? -1;
            if (open === -1) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }
            if (open !== 0) {
                node = node.splitText(open);
                walker.currentNode = node;
            }
            const close = node.nodeValue?.indexOf(BinderSyntaxClose) ?? -1;
            if (close === -1) {
                if (first !== last && node === last) break;
                node = walker.nextNode();
                continue;
            }
            if (close + 2 !== node.nodeValue?.length) {
                node.splitText(close + 2);
            }
            name = 'text';
            value = node.textContent ?? '';
            node.textContent = '';
            promises.push(BinderCreate(context, binders, rewrites, node, name, value));
        } else if (node.nodeType === BinderElement) {
            if (node.hasAttributes()) {
                let each = false;
                for (name of node.getAttributeNames()){
                    value = node.getAttribute(name);
                    if (value && value.startsWith(BinderSyntaxOpen) && value.endsWith(BinderSyntaxClose)) {
                        node.removeAttribute(name);
                        name = name.startsWith(BinderSyntaxAttribute) ? name.slice(2) : name;
                        if (!each) each = name === 'each';
                        promises.push(BinderCreate(context, binders, rewrites, node, name, value));
                    }
                }
                if (each) {
                    if (first !== last && node === last) break;
                    node = walker.nextSibling();
                    continue;
                }
            }
        }
        if (first !== last && node === last) {
            break;
        }
        node = walker.nextNode();
    }
    await Promise.all(promises);
};
const BinderDestroy = async function(binders, node) {
    await BinderNext;
    const x = Reflect.get(node, 'x');
    if (x?.constructor === Object) {
        let name, binder, path, current;
        for(name in x){
            binder = x[name];
            for (path of binder.paths){
                current = binders.get(path);
                current?.delete(binder);
                if (current?.size === 0) binders.delete(path);
            }
        }
        Reflect.deleteProperty(node, 'x');
    }
};
const BinderRemove = async function(binders, root) {
    let node;
    const promises = [];
    const walker = document.createTreeWalker(root, 5);
    if (walker.currentNode.nodeType === BinderFragment) {
        node = walker.nextNode();
    } else {
        node = walker.currentNode;
    }
    while(node){
        if (node.nodeType === BinderText) {
            if (Reflect.has(node, 'x')) {
                promises.push(BinderDestroy(binders, node));
            }
        } else if (node.nodeType === BinderElement) {
            if (Reflect.has(node, 'x')) {
                promises.push(BinderDestroy(binders, node));
            }
        }
        node = walker.nextNode();
    }
    await Promise.all(promises);
};
const htmlRender = async function(binder) {
    const tasks = [];
    const data = await binder.compute();
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
        tasks.push(BinderRemove(binder.binders, node));
        node = binder.owner.lastChild;
    }
    tasks.push(BinderAdd(binder.context, binder.binders, binder.rewrites, fragment));
    await Promise.all(tasks);
    binder.owner.appendChild(fragment);
};
const htmlReset = async function(binder) {
    const tasks = [];
    let node = binder.owner.lastChild;
    while(node){
        binder.owner.removeChild(node);
        tasks.push(BinderRemove(binder.binders, node));
        node = binder.owner.lastChild;
    }
    await Promise.all(tasks);
};
const htmlDefault = {
    render: htmlRender,
    reset: htmlReset
};
const eachWhitespace = /^\s*$/;
const eachText = Node.TEXT_NODE;
const eachSetup = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');
    let node = binder.owner.firstChild;
    while(node){
        if (node.nodeType === eachText && node.nodeValue && eachWhitespace.test(node.nodeValue)) {
            binder.owner.removeChild(node);
        } else {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
        }
        node = binder.owner.firstChild;
    }
};
const eachRender = async function(binder) {
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
        binder.meta.data = [];
        binder.meta.targetLength = 0;
        console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
    }
    if (binder.meta.currentLength > binder.meta.targetLength) {
        let count, node;
        while(binder.meta.currentLength > binder.meta.targetLength){
            count = binder.meta.templateLength;
            while(count--){
                node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                tasks.push(BinderRemove(binder.binders, node));
            }
            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, first, last, context, rewrites;
        while(binder.meta.currentLength < binder.meta.targetLength){
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;
            rewrites = [
                ...binder.rewrites,
                [
                    binder.meta.variable,
                    `${binder.meta.path}.${keyValue}`
                ]
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
            clone = binder.meta.templateElement.content.cloneNode(true);
            first = clone.firstChild;
            last = clone.lastChild;
            binder.meta.queueElement.content.appendChild(clone);
            tasks.push(BinderAdd(context, binder.binders, rewrites, binder.meta.queueElement.content, first, last));
        }
    }
    if (binder.meta.currentLength === binder.meta.targetLength) {
        await Promise.all(tasks);
        binder.owner.appendChild(binder.meta.queueElement.content);
    }
};
const eachReset = async function(binder) {
    const tasks = [];
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    while(binder.owner.lastChild){
        tasks.push(BinderRemove(binder.binders, binder.owner.removeChild(binder.owner.lastChild)));
    }
    while(binder.meta.queueElement.content.lastChild){
        tasks.push(BinderRemove(binder.binders, binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild)));
    }
    await Promise.all(tasks);
};
const eachDefault = {
    setup: eachSetup,
    render: eachRender,
    reset: eachReset
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
const Cache = new WeakMap();
const ContextResolve = async function(item, method) {
    await Promise.resolve(item).then(method);
};
const ContextEvent = async function([binders, path, event]) {
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
    await Promise.all(parents.map(async (binder)=>await binder[event]?.()));
    await Promise.all(children.map(async (binder)=>await binder[event]?.()));
};
const ContextSet = function(binders, path, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (key === 'length') {
        ContextResolve([
            binders,
            path,
            'render'
        ], ContextEvent);
        ContextResolve([
            binders,
            path ? `${path}.${key}` : key,
            'render'
        ], ContextEvent);
        return true;
    }
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && typeof from === 'object') {
        const cache = Cache.get(from);
        if (cache === value) return true;
        Cache.delete(from);
    }
    Reflect.set(target, key, value, receiver);
    path = path ? `${path}.${key}` : key;
    ContextResolve([
        binders,
        path,
        'render'
    ], ContextEvent);
    return true;
};
const ContextGet = function(binders, path, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : key;
        const cache = Cache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, binders, path),
            set: ContextSet.bind(null, binders, path),
            deleteProperty: ContextDelete.bind(null, binders, path)
        });
        Cache.set(value, proxy);
        return proxy;
    }
    return value;
};
const ContextDelete = function(binders, path, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    const from = Reflect.get(target, key);
    Cache.delete(from);
    Reflect.deleteProperty(target, key);
    path = path ? `${path}.${key}` : key;
    ContextResolve([
        binders,
        path,
        'reset'
    ], ContextEvent);
    return true;
};
const ContextCreate = function(data, binders, path = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, binders, path),
        set: ContextSet.bind(null, binders, path),
        deleteProperty: ContextDelete.bind(null, binders, path)
    });
};
class VNode {
    node;
    name;
    children = new Set();
    attributes = new Map();
    constructor(node){
        this.node = node;
        this.name = node.nodeName.toLowerCase();
        if (node.nodeType === Node.ELEMENT_NODE && node.hasAttributes()) {
            for (const attribute of node.attributes){
                this.attributes.set(attribute.name, attribute.value);
            }
        }
    }
    append(node) {
        this.children.add(node);
    }
}
const Virtualize = function(root) {
    let child = root.firstChild;
    const source = new VNode(root);
    const target = new VNode(root);
    while(child){
        if (child.nodeType === Node.ELEMENT_NODE && child.hasChildNodes()) {
            const virtual = Virtualize(child);
            source.append(virtual.source);
            target.append(virtual.target);
        } else {
            source.append(new VNode(child));
            target.append(new VNode(child));
        }
        child = child.nextSibling;
    }
    return {
        source,
        target
    };
};
class XElement extends HTMLElement {
    static observedProperties;
    static navigation = navigation;
    static slottedEvent = new Event('slotted');
    static slottingEvent = new Event('slotting');
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
    #nodes = new Map();
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
        if (this.#preparing) return new Promise((resolve)=>this.addEventListener('prepared', ()=>resolve(undefined)));
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
            if ('attributeChangedCallback' === property || 'disconnectedCallback' === property || 'connectedCallback' === property || 'adoptedCallback' === property || 'slottedCallback' === property || 'disconnected' === property || 'constructor' === property || 'attributed' === property || 'connected' === property || 'adopted' === property || 'slotted' === property || property.startsWith('#')) continue;
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
        if (this.shadowRoot) {
            const slots = this.shadowRoot.querySelectorAll('slot');
            globalThis.virtual = Virtualize(this.shadowRoot);
            console.log(globalThis.virtual);
            promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, this.shadowRoot));
            for (const slot of slots){
                const nodes = slot.assignedNodes();
                for (const node of nodes){
                    promises.push(BinderAdd(this.#context, this.#binders, this.#rewrites, node));
                }
            }
        }
        await Promise.all(promises);
        this.#prepared = true;
        this.#preparing = false;
        this.dispatchEvent(XElement.preparedEvent);
    }
    async bind() {}
    async unbind() {}
    async slottedCallback() {
        console.log('slottedCallback');
        this.dispatchEvent(XElement.slottingEvent);
        await this.slotted?.();
        this.dispatchEvent(XElement.slottedEvent);
    }
    async connectedCallback() {
        console.log('connectedCallback');
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
