// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const promise = Promise.resolve();
const tick = function(method) {
    return promise.then(method);
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
    checked: Symbol('checked'),
    value: Symbol('value'),
    parseable,
    display,
    dash,
    tick
});
const ContextGet = function(event, reference, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: ContextGet.bind(null, event, reference),
            set: ContextSet.bind(null, event, reference),
            deleteProperty: ContextDelete.bind(null, event, reference)
        });
    }
    return value;
};
const ContextDelete = function(event, reference, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    Reflect.deleteProperty(target, key);
    tick(async function contextTick() {
        await event(reference ? `${reference}.${key}` : `${key}`, 'reset');
    });
    return true;
};
const ContextSet = function(event, reference, target, key, to, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, to, receiver);
    if (key === 'length') {
        Reflect.set(target, key, to, receiver);
        tick(async function contextTick() {
            await event(reference, 'render');
        });
        tick(async function contextTick() {
            await event(reference ? `${reference}.${key}` : `${key}`, 'render');
        });
        return true;
    }
    const from = Reflect.get(target, key, receiver);
    if (from === to) return true;
    if (Number.isNaN(from) && Number.isNaN(to)) return true;
    Reflect.set(target, key, to, receiver);
    tick(async function contextTick() {
        await event(reference ? `${reference}.${key}` : `${key}`, 'render');
    });
    return true;
};
const navigators = new Map();
const transition = async (options)=>{
    if (options.cache && options.instance) return options.target.replaceChildren(options.instance);
    if (options.navigating) return;
    else options.navigating = true;
    options.construct = options.construct ?? (await import(options.file)).default;
    if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');
    options.name = options.name ?? dash(options.construct.name);
    if (!/^\w+-\w+/.test(options.name)) options.name = `x-${options.name}`;
    if (!customElements.get(options.name)) customElements.define(options.name, options.construct);
    options.instance = document.createElement(options.name);
    options.target.replaceChildren(options.instance);
    options.navigating = false;
};
const navigate = (event)=>{
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
        if (options.instance === options.target.lastElementChild) return event.transitionWhile((async ()=>undefined)());
        return event.transitionWhile(transition(options));
    } else {
        transition(options);
    }
};
function navigation(path, file, options) {
    if (!path) throw new Error('XElement - navigation path required');
    if (!file) throw new Error('XElement - navigation file required');
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    options = options ?? {};
    options.path = path;
    options.cache = options.cache ?? true;
    options.query = options.query ?? 'main';
    options.file = new URL(file, base.href).href;
    navigators.set(path, options);
    navigate();
    window.navigation.addEventListener('navigate', navigate);
}
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
        binder.node.textContent = toolDefault.display(data);
    } else if (binder.meta.boolean) {
        const data1 = await binder.compute() ? true : false;
        if (data1) binder.owner.setAttributeNode(binder.node);
        else binder.owner.removeAttribute(binder.name);
    } else {
        let data2 = await binder.compute();
        data2 = toolDefault.display(data2);
        binder.owner[binder.name] = data2;
        binder.owner.setAttribute(binder.name, data2);
    }
};
const standardReset = function(binder) {
    if (binder.name == 'text') {
        binder.node.textContent = '';
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
const checkedEvent = new CustomEvent('xRadioInputHandler');
const checkedHandler = async function(event, binder) {
    const owner = binder.owner;
    const checked = event === undefined ? undefined : owner.checked;
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = !!event;
    binder.instance.$checked = checked;
    const computed = await binder.compute();
    if (computed) {
        owner.setAttributeNode(binder.node);
    } else {
        owner.removeAttribute('checked');
    }
};
const checkedSetup = function(binder) {
    if (binder.owner.type === 'radio') {
        binder.owner.addEventListener('xRadioInputHandler', (event)=>checkedHandler(event, binder));
        binder.owner.addEventListener('input', async (event)=>{
            const parent = binder.owner.form || binder.owner.getRootNode();
            const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
            await checkedHandler(event, binder);
            for (const radio of radios){
                if (radio === event.target) continue;
                radio.checked = false;
                radio.dispatchEvent(checkedEvent);
            }
        });
    } else {
        binder.owner.addEventListener('input', (event)=>checkedHandler(event, binder));
    }
};
const checkedRender = async function(binder) {
    await checkedHandler(undefined, binder);
};
const checkedReset = function(binder) {
    binder.owner?.removeAttribute('checked');
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
    await binder.container.register(binder.owner, binder.context, binder.rewrites);
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
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = true;
    const owner = binder.owner;
    if (owner.type === 'select-one') {
        const option = owner.selectedOptions[0];
        if (option) {
            if (toolDefault.value in option) {
                binder.instance.$value = option[toolDefault.value];
            } else {
                binder.instance.$value = option.value;
            }
        } else {
            binder.instance.$value = undefined;
        }
    } else if (owner.type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(owner.selectedOptions, (option)=>toolDefault.value in option ? option[toolDefault.value] : option.value);
    } else if (owner.type === 'number' || owner.type === 'range' || dateDefault.includes(owner.type)) {
        if (toolDefault.value in binder.owner && typeof owner[toolDefault.value] === 'number') {
            binder.instance.$value = owner.valueAsNumber;
        } else {
            binder.instance.$value = owner.value;
        }
    } else if (owner.nodeName == 'OPTION') {
        throw 'option event';
    } else {
        if (toolDefault.value in binder.owner && toolDefault.parseable(owner[toolDefault.value])) {
            binder.instance.$value = JSON.parse(owner.value);
        } else {
            binder.instance.$value = owner.value;
        }
    }
    owner[toolDefault.value] = await binder.compute();
};
const valueSetup = function(binder) {
    binder.owner.addEventListener('input', (event)=>valueInput(binder, event));
};
const valueRender = async function(binder) {
    binder.instance.$assign = false;
    binder.instance.event = undefined;
    binder.instance.$event = undefined;
    binder.instance.$value = undefined;
    const computed = await binder.compute();
    const owner = binder.owner;
    owner.value = '';
    let display;
    if (owner.type === 'select-one') {
        for(let i = 0; i < owner.options.length; i++){
            const option = owner.options[i];
            option.selected = toolDefault.value in option ? option[toolDefault.value] === computed : option.value === computed;
        }
        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[0].selected = true;
            return owner.dispatchEvent(valueEvent);
        }
        display = toolDefault.display(computed);
    } else if (owner.type === 'select-multiple') {
        for(let i1 = 0; i1 < owner.options.length; i1++){
            const option1 = owner.options[i1];
            option1.selected = computed?.includes(toolDefault.value in option1 ? option1[toolDefault.value] : option1.value);
        }
        display = toolDefault.display(computed);
    } else if (owner.type === 'number' || owner.type === 'range' || dateDefault.includes(owner.type)) {
        if (typeof computed === 'string') owner.value = computed;
        else if (typeof computed === 'number' && !isNaN(computed)) owner.valueAsNumber = computed;
        else owner.value = '';
        display = owner.value;
    } else {
        display = toolDefault.display(computed);
        owner.value = display;
    }
    owner[toolDefault.value] = computed;
    owner.setAttribute('value', display);
};
const valueReset = function(binder) {
    const owner = binder.owner;
    if (owner.type === 'select-one' || owner.type === 'select-multiple') {
        for (const option of owner.options){
            option.selected = false;
        }
    }
    owner.value = '';
    owner.setAttribute('value', '');
    owner[toolDefault.value] = undefined;
};
const valueDefault = {
    setup: valueSetup,
    render: valueRender,
    reset: valueReset
};
const htmlRender = async function(binder) {
    const data = await binder.compute();
    let fragment, node, tasks = [];
    if (typeof data == 'string') {
        const template = document.createElement('template');
        template.innerHTML = data;
        fragment = template.content;
    } else if (data instanceof HTMLTemplateElement) {
        fragment = data.content.cloneNode(true);
    } else {
        return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
    }
    node = binder.owner.lastChild;
    while(node){
        binder.owner.removeChild(node);
        binder.container.release(node);
        node = binder.owner.lastChild;
    }
    node = fragment.firstChild;
    while(node){
        tasks.push(binder.container.register(node, binder.context));
        node = node.nextSibling;
    }
    await Promise.all(tasks);
    binder.owner.appendChild(fragment);
};
const htmlReset = function(binder) {
    let node = binder.owner.lastChild;
    while(node){
        binder.owner.removeChild(node);
        binder.container.release(node);
        node = binder.owner.lastChild;
    }
};
const htmlDefault = {
    render: htmlRender,
    reset: htmlReset
};
const whitespace = /\s+/;
const eachSetup = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');
    let node = binder.owner.firstChild;
    while(node){
        if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue)) {
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
    const [data, variable, key, index] = await binder.compute();
    const [reference] = binder.references;
    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variable = variable;
    binder.meta.reference = reference;
    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else if (data?.constructor === Object) {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    } else {
        return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
    }
    if (binder.meta.currentLength > binder.meta.targetLength) {
        while(binder.meta.currentLength > binder.meta.targetLength){
            let count = binder.meta.templateLength, node;
            while(count--){
                node = binder.owner.lastChild;
                if (node) {
                    binder.owner.removeChild(node);
                    tasks.push(binder.container.release(node));
                }
            }
            binder.meta.currentLength--;
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            await Promise.all(tasks);
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, context, rewrites;
        while(binder.meta.currentLength < binder.meta.targetLength){
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;
            rewrites = [
                ...binder.rewrites,
                [
                    binder.meta.variable,
                    `${binder.meta.reference}.${keyValue}`
                ], 
            ];
            context = new Proxy(binder.context, {
                has: (target, key)=>key === binder.meta.variable || key === binder.meta.keyName || key === binder.meta.indexName || Reflect.has(target, key),
                get: (target, key, receiver)=>key === binder.meta.keyName ? keyValue : key === binder.meta.indexName ? indexValue : key === binder.meta.variable ? Reflect.get(binder.meta.data, keyValue) : Reflect.get(target, key, receiver),
                set: (target, key, value, receiver)=>key === binder.meta.keyName ? true : key === binder.meta.indexName ? true : key === binder.meta.variable ? Reflect.set(binder.meta.data, keyValue, value) : Reflect.set(target, key, value, receiver)
            });
            let node1 = binder.meta.templateElement.content.firstChild;
            while(node1){
                clone = node1.cloneNode(true);
                tasks.push(binder.container.register(clone, context, rewrites));
                binder.meta.queueElement.content.appendChild(clone);
                node1 = node1.nextSibling;
            }
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {
            await Promise.all(tasks);
            binder.owner.appendChild(binder.meta.queueElement.content);
        }
    }
};
const eachReset = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    while(binder.owner.lastChild)binder.container.release(binder.owner.removeChild(binder.owner.lastChild));
    while(binder.meta.queueElement.content.lastChild)binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
};
const eachDefault = {
    setup: eachSetup,
    render: eachRender,
    reset: eachReset
};
const onValue = function(element) {
    if (!element) return undefined;
    if (toolDefault.value in element) {
        return toolDefault.parseable(element[toolDefault.value]) ? JSON.parse(JSON.stringify(element[toolDefault.value])) : element[toolDefault.value];
    }
    if (element.type === 'number' || element.type === 'range') {
        return element.valueAsNumber;
    }
    return element.value;
};
const onSubmitHandler = async function(event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name , checked  } = element;
        if (!name) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;
        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions){
                value.push(onValue(option));
            }
        } else if (type === 'select-one') {
            const [option1] = element.selectedOptions;
            value = onValue(option1);
        } else {
            value = onValue(element);
        }
        let data = form;
        const parts = name.split(/\s*\.\s*/);
        for(let index = 0; index < parts.length; index++){
            const part = parts[index];
            const next = parts[index + 1];
            if (next) {
                if (!data[part]) {
                    data[part] = /[0-9]+/.test(next) ? [] : {};
                }
                data = data[part];
            } else {
                data[part] = value;
            }
        }
    }
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$form = form;
    await binder.compute();
    if (target.hasAttribute('reset')) {
        for (const element1 of elements){
            const { type: type1 , name: name1  } = element1;
            if (!name1) continue;
            else if (type1 === 'submit' || type1 === 'button') continue;
            else if (type1 === 'select-one') element1.selectedIndex = 0;
            else if (type1 === 'select-multiple') element1.selectedIndex = -1;
            else if (type1 === 'radio' || type1 === 'checkbox') element1.checked = false;
            else element1.value = '';
            element1.dispatchEvent(new Event('input'));
        }
    }
    return false;
};
const onResetHandler = async function(event, binder) {
    event.preventDefault();
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements){
        const { type , name  } = element;
        if (!name) continue;
        else if (type === 'submit' || type === 'button') continue;
        else if (type === 'select-one') element.selectedIndex = 0;
        else if (type === 'select-multiple') element.selectedIndex = -1;
        else if (type === 'radio' || type === 'checkbox') element.checked = false;
        else element.value = '';
        element.dispatchEvent(new Event('input'));
    }
    binder.instance.event = event;
    binder.instance.$event = event;
    await binder.compute();
    return false;
};
const onSetup = function(binder) {
    binder.owner[binder.name] = undefined;
    binder.meta.name = binder.name.slice(2);
};
const onRender = function(binder) {
    if (binder.meta.method) {
        binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
    }
    binder.meta.method = (event)=>{
        if (binder.meta.name === 'reset') {
            return onResetHandler(event, binder);
        } else if (binder.meta.name === 'submit') {
            return onSubmitHandler(event, binder);
        } else {
            binder.instance.event = event;
            binder.instance.$event = event;
            return binder.compute();
        }
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
const referencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const stringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const regularFunctionPattern = /function\s*\([a-zA-Z0-9$_,]*\)/g;
const arrowFunctionPattern = /(\([a-zA-Z0-9$_,]*\)|[a-zA-Z0-9$_]+)\s*=>/g;
const assignmentPattern = /\(.*?([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)\)/;
const ignoreString = `
(\\b\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
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
(([.][a-zA-Z0-9$_.? ]*)?\\b)
`.replace(/\t|\n/g, '');
const ignorePattern = new RegExp(ignoreString, 'g');
const Cache = new Map();
function Binder(node, container, context, rewrites) {
    let name, value, owner;
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node;
        value = text.textContent ?? '';
        name = 'text';
        owner = text;
        text.textContent = '';
    } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        const attr = node;
        owner = attr.ownerElement;
        value = attr.value ?? '';
        name = attr.name ?? '';
        attr.value = '';
    } else {
        throw new Error('XElement - Node not valid');
    }
    let handler;
    if (name === 'html') handler = htmlDefault;
    else if (name === 'each') handler = eachDefault;
    else if (name === 'value') handler = valueDefault;
    else if (name === 'checked') handler = checkedDefault;
    else if (name === 'inherit') handler = inheritDefault;
    else if (name.startsWith('on')) handler = onDefault;
    else handler = standardDefault;
    let cache = Cache.get(value);
    if (!cache) {
        const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
        const clean = code.replace(stringPattern, '').replace(arrowFunctionPattern, '').replace(regularFunctionPattern, '');
        const assignment = clean.match(assignmentPattern);
        const references = clean.replace(ignorePattern, '').match(referencePattern) ?? [];
        const isValue = name === 'value';
        const isChecked = name === 'checked';
        let wrapped;
        if (assignment && isValue) {
            wrapped = `
            with ($context) {
                with ($instance) {
                    $value = $assign ? $value : ${assignment?.[1]};
                    return $assign ? ${code} : ${assignment?.[3]};
                }
            }
            `;
        } else if (assignment && isChecked) {
            wrapped = `
            with ($context) {
                with ($instance) {
                    $checked = $assign ? $checked : ${assignment?.[1]};
                    return $assign ? ${code} : ${assignment?.[3]};
                }
            }
            `;
        } else {
            wrapped = `
            with ($context) {
                with ($instance) {
                   return ${code};
                }
            }
            `;
        }
        const compute = new Function('$context', '$instance', wrapped);
        cache = {
            compute,
            references
        };
        Cache.set(value, cache);
    }
    const instance = {};
    const references1 = new Set();
    let reference, nameRewrite, valueRewrite;
    for (reference of cache.references){
        if (rewrites) {
            for ([nameRewrite, valueRewrite] of rewrites){
                if (reference === nameRewrite) {
                    reference = valueRewrite;
                } else if (reference.startsWith(nameRewrite + '.')) {
                    reference = valueRewrite + reference.slice(nameRewrite.length);
                }
            }
        }
        references1.add(reference);
    }
    const binder = {
        name,
        node,
        value,
        owner,
        handler,
        context,
        instance,
        container,
        references: references1,
        meta: {},
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render,
        rewrites: rewrites ? [
            ...rewrites
        ] : [],
        compute: cache.compute.bind(owner, context, instance)
    };
    binder.setup?.(binder);
    return binder;
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
    #binders = new Map();
    #mutator = new MutationObserver(this.#mutation.bind(this));
    #context = new Proxy({}, {
        get: ContextGet.bind(null, this.#change.bind(this), ''),
        set: ContextSet.bind(null, this.#change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this.#change.bind(this), '')
    });
    constructor(){
        super();
        if (!this.shadowRoot) this.attachShadow({
            mode: 'open'
        });
        this.#mutator.observe(this, {
            childList: true
        });
        this.#mutator.observe(this.shadowRoot, {
            childList: true
        });
    }
    async #change(reference, type) {
        const tasks = [];
        let key, binder, binders;
        for ([key, binders] of this.#binders){
            if (binders) {
                if (key == reference) {
                    for (binder of binders){
                        tasks.push(binder);
                    }
                } else if (key?.startsWith?.(`${reference}.`)) {
                    for (binder of binders){
                        tasks.push(binder);
                    }
                }
            }
        }
        await Promise.all(tasks.map(async (task)=>await task[type](task)));
    }
    #mutation(mutations) {
        if (this.#prepared) {
            let mutation, node;
            for (mutation of mutations){
                for (node of mutation.addedNodes){
                    this.register(node, this.#context, []);
                }
                for (node of mutation.removedNodes){
                    this.release(node);
                }
            }
        } else {
            this.prepare();
        }
    }
    #remove(node1) {
        const binders1 = this.#binders.get(node1);
        if (!binders1) return;
        let binder1, reference1;
        for (binder1 of binders1){
            for (reference1 of binder1.references){
                if (this.#binders.has(reference1)) {
                    this.#binders.get(reference1)?.delete(binder1);
                    if (!this.#binders.get(reference1)?.size) this.#binders.delete(reference1);
                }
            }
        }
        this.#binders.delete(node1);
    }
    async #add(node2, context, rewrites) {
        const binder2 = Binder(node2, this, context, rewrites);
        let binders2, reference2;
        for (reference2 of binder2.references){
            binders2 = this.#binders.get(reference2);
            if (binders2) {
                binders2.add(binder2);
            } else {
                this.#binders.set(reference2, new Set([
                    binder2
                ]));
            }
        }
        const nodes = this.#binders.get(binder2.owner ?? binder2.node);
        if (nodes) {
            nodes.add(binder2);
        } else {
            this.#binders.set(binder2.owner ?? binder2.node, new Set([
                binder2
            ]));
        }
        await binder2.render(binder2);
    }
    async prepare() {
        if (this.#prepared) return;
        if (this.#preparing) return new Promise((resolve)=>this.addEventListener('preparing', ()=>resolve(undefined)));
        this.#preparing = true;
        this.dispatchEvent(XElement.preparingEvent);
        const prototype = Object.getPrototypeOf(this);
        const properties = XElement.observedProperties;
        const descriptors = {
            ...Object.getOwnPropertyDescriptors(this),
            ...Object.getOwnPropertyDescriptors(prototype)
        };
        for(const property in descriptors){
            if (properties && !properties?.includes(property) || 'attributeChangedCallback' === property || 'disconnectedCallback' === property || 'connectedCallback' === property || 'adoptedCallback' === property || 'disconnected' === property || 'constructor' === property || 'attributed' === property || 'connected' === property || 'adopted' === property || property.startsWith('#')) continue;
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
        await this.register(this.shadowRoot, this.#context);
        await this.register(this, this.#context);
        this.#prepared = true;
        this.#preparing = false;
        this.dispatchEvent(XElement.preparedEvent);
    }
    async release(node) {
        const tasks = [];
        if (node.nodeType == Node.TEXT_NODE) {
            tasks.push(this.#remove(node));
        } else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while(child){
                tasks.push(this.release(child));
                child = child.nextSibling;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            tasks.push(this.#remove(node));
            let attribute;
            for (attribute of node.attributes){
                tasks.push(this.#remove(attribute));
            }
            let child1 = node.firstChild;
            while(child1){
                tasks.push(this.release(child1));
                child1 = child1.nextSibling;
            }
        }
        await Promise.all(tasks);
    }
    async register(node, context, rewrites) {
        const tasks = [];
        if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while(child){
                tasks.push(this.register(child, context, rewrites));
                child = child.nextSibling;
            }
        } else if (node.nodeType == node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf(XElement.syntaxStart) ?? -1;
            if (start == -1) return;
            if (start != 0) node = node.splitText(start);
            const end = node.nodeValue?.indexOf(XElement.syntaxEnd) ?? -1;
            if (end == -1) return;
            if (end + XElement.syntaxLength != node.nodeValue?.length) {
                tasks.push(this.register(node.splitText(end + XElement.syntaxLength), context, rewrites));
            }
            tasks.push(this.#add(node, context, rewrites));
        } else if (node.nodeType == node.ELEMENT_NODE) {
            let attribute;
            const html = node.attributes.html;
            const each = node.attributes.each;
            if (html) await this.#add(html, context, rewrites);
            if (each) await this.#add(each, context, rewrites);
            for (attribute of node.attributes){
                if (html === attribute) continue;
                if (each === attribute) continue;
                if (XElement.syntaxMatch.test(attribute.value)) {
                    tasks.push(this.#add(attribute, context, rewrites));
                }
            }
            if (!html && !each) {
                let child1 = node.firstChild;
                while(child1){
                    tasks.push(this.register(child1, context, rewrites));
                    child1 = child1.nextSibling;
                }
            }
        }
        await Promise.all(tasks);
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
