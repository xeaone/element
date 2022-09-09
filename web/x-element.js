const promise = Promise.resolve();
function tick(method) {
    return promise.then(method);
}

const ContextGet = function (event, reference, target, key, receiver) {
    if (typeof key === 'symbol')
        return Reflect.get(target, key, receiver);
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
const ContextDelete = function (event, reference, target, key) {
    if (typeof key === 'symbol')
        return Reflect.deleteProperty(target, key);
    Reflect.deleteProperty(target, key);
    tick(async function contextTick() { event(reference ? `${reference}.${key}` : `${key}`, 'reset'); });
    return true;
};
const ContextSet = function (event, reference, target, key, to, receiver) {
    if (typeof key === 'symbol')
        return Reflect.set(target, key, receiver);
    const from = Reflect.get(target, key, receiver);
    if (key === 'length') {
        tick(async function contextTick() { event(reference, 'render'); });
        tick(async function contextTick() { event(reference ? `${reference}.${key}` : `${key}`, 'render'); });
        return Reflect.set(target, key, to, receiver);
    }
    else if (from === to || isNaN(from) && to === isNaN(to)) {
        return Reflect.set(target, key, to, receiver);
    }
    Reflect.set(target, key, to, receiver);
    tick(async function contextTick() { event(reference ? `${reference}.${key}` : `${key}`, 'render'); });
    return true;
};

function dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}

const navigators = new Map();
const transition = async (options) => {
    if (options.cache && options.instance)
        return options.target.replaceChildren(options.instance);
    if (options.navigating)
        return;
    else
        options.navigating = true;
    options.construct = options.construct ?? (await import(options.file)).default;
    if (!options.construct?.prototype)
        throw new Error('XElement - navigation construct not valid');
    options.name = options.name ?? dash(options.construct.name);
    if (!/^\w+-\w+/.test(options.name))
        options.name = `x-${options.name}`;
    if (!customElements.get(options.name))
        customElements.define(options.name, options.construct);
    options.instance = document.createElement(options.name);
    options.target.replaceChildren(options.instance);
    options.navigating = false;
};
const navigate = (event) => {
    if (event && ('canTransition' in event && !event.canTransition || 'canIntercept' in event && !event.canIntercept))
        return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const options = navigators.get(pathname) ?? navigators.get('/*');
    if (!options)
        return;
    options.target = options.target ?? document.querySelector(options.query);
    if (!options.target)
        throw new Error('XElement - navigation target not found');
    if (event?.intercept) {
        if (options.instance === options.target.lastElementChild)
            return event.intercept();
        return event.intercept({ handler: () => transition(options) });
    }
    else if (event?.transitionWhile) {
        if (options.instance === options.target.lastElementChild)
            return event.transitionWhile((async () => undefined)());
        return event.transitionWhile(transition(options));
    }
    else {
        transition(options);
    }
};
function navigation(path, file, options) {
    if (!path)
        throw new Error('XElement - navigation path required');
    if (!file)
        throw new Error('XElement - navigation file required');
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

var booleans = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

var Standard = {
    setup(binder) {
        binder.node.value = '';
        binder.meta.boolean = booleans.includes(binder.name);
    },
    render(binder) {
        if (binder.meta.boolean) {
            const data = binder.compute() ? true : false;
            if (data)
                binder.owner.setAttributeNode(binder.node);
            else
                binder.owner.removeAttribute(binder.name);
        }
        else {
            let data = binder.compute();
            data =
                typeof data == 'string' ? data :
                    typeof data == 'undefined' ? '' :
                        typeof data == 'object' ? JSON.stringify(data) : data;
            binder.owner[binder.name] = data;
            binder.owner.setAttribute(binder.name, data);
        }
    },
    reset(binder) {
        if (binder.meta.boolean) {
            binder.owner.removeAttribute(binder.name);
        }
        else {
            binder.owner[binder.name] = undefined;
            binder.owner?.setAttribute(binder.name, '');
        }
    }
};

const xRadioInputHandlerEvent = new CustomEvent('xRadioInputHandler');
const checkedHandler = function (event, binder) {
    const owner = binder.owner;
    const checked = owner.checked;
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = !!event;
    binder.instance.$checked = checked;
    const computed = binder.compute();
    if (computed) {
        owner.setAttributeNode(binder.node);
    }
    else {
        owner.removeAttribute('checked');
    }
};
var Checked = {
    setup(binder) {
        if (binder.owner.type === 'radio') {
            binder.owner.addEventListener('xRadioInputHandler', (event) => checkedHandler(event, binder));
            binder.owner.addEventListener('input', (event) => {
                const parent = binder.owner.form || binder.owner.getRootNode();
                const radios = parent.querySelectorAll(`[type="radio"][name="${binder.owner.name}"]`);
                checkedHandler(event, binder);
                for (const radio of radios) {
                    if (radio === event.target)
                        continue;
                    radio.checked = false;
                    radio.dispatchEvent(xRadioInputHandlerEvent);
                }
            });
        }
        else {
            binder.owner.addEventListener('input', (event) => checkedHandler(event, binder));
        }
    },
    render(binder) {
        checkedHandler(undefined, binder);
    },
    reset(binder) {
        binder.owner?.removeAttribute('checked');
    }
};

var Inherit = {
    setup(binder) {
        binder.node.value = '';
        binder.meta.rerendered = false;
    },
    render(binder) {
        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }
        const inherited = binder.compute();
        binder.owner.inherited?.(inherited);
        if (!binder.meta.rerendered) {
            binder.meta.rerendered = true;
            binder.container.register(binder.owner, binder.context, binder.rewrites);
        }
    },
    reset(binder) {
        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }
        binder.owner.inherited?.();
    }
};

var utility = Object.freeze({
    value: Symbol('value'),
    parent: Symbol('parent'),
    parseable(value) {
        return !isNaN(value) && value !== undefined && typeof value !== 'string';
    }
});

var date = [
    'date', 'datetime-local', 'month', 'time', 'week'
];

const valueEvent = new Event('input');
const valueDisplay = function (data) {
    return typeof data == 'string' ? data :
        typeof data == 'undefined' ? '' :
            typeof data == 'object' ? JSON.stringify(data) :
                data;
};
const valueInput = function (binder, event) {
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = true;
    if (binder.owner.type === 'select-one') {
        const [option] = binder.owner.selectedOptions;
        binder.instance.$value = option ? utility.value in option ? option[utility.value] : option.value : undefined;
        binder.owner[utility.value] = binder.compute();
    }
    else if (binder.owner.type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(binder.owner.selectedOptions, o => utility.value in o ? o[utility.value] : o.value);
        binder.owner[utility.value] = binder.compute();
    }
    else if (binder.owner.type === 'number' || binder.owner.type === 'range' || date.includes(binder.owner.type)) {
        binder.instance.$value = utility.value in binder.owner && typeof binder.owner[utility.value] === 'number' ? binder.owner.valueAsNumber : binder.owner.value;
        binder.owner[utility.value] = binder.compute();
    }
    else if (binder.owner.nodeName == 'OPTION') {
        throw 'option event';
    }
    else {
        binder.instance.$value = utility.value in binder.owner && utility.parseable(binder.owner[utility.value]) ? JSON.parse(binder.owner.value) : binder.owner.value;
        binder.instance.$checked = utility.value in binder.owner && utility.parseable(binder.owner[utility.value]) ? JSON.parse(binder.owner.checked) : binder.owner.checked;
        binder.owner[utility.value] = binder.compute();
    }
};
var Value = {
    setup(binder) {
        binder.owner.value = '';
        binder.meta.type = binder.owner.type;
        binder.owner.addEventListener('input', (event) => valueInput(binder, event));
    },
    render(binder) {
        binder.instance.$assign = false;
        binder.instance.event = undefined;
        binder.instance.$event = undefined;
        binder.instance.$value = undefined;
        binder.instance.$checked = undefined;
        const computed = binder.compute();
        let display;
        if (binder.meta.type === 'select-one') {
            for (const option of binder.owner.options) {
                option.selected = utility.value in option ? option[utility.value] === computed : option.value === computed;
            }
            if (computed === undefined && binder.owner.options.length && !binder.owner.selectedOptions.length) {
                binder.owner.options[0].selected = true;
                return binder.owner.dispatchEvent(valueEvent);
            }
            display = valueDisplay(computed);
            binder.owner.value = display;
        }
        else if (binder.meta.type === 'select-multiple') {
            for (const option of binder.owner.options) {
                option.selected = computed?.includes(utility.value in option ? option[utility.value] : option.value);
            }
            display = valueDisplay(computed);
        }
        else if (binder.meta.type === 'number' || binder.meta.type === 'range' || date.includes(binder.meta.type)) {
            if (typeof computed === 'string')
                binder.owner.value = computed;
            else if (typeof computed === 'number' && !isNaN(computed))
                binder.owner.valueAsNumber = computed;
            else
                binder.owner.value = '';
            display = binder.owner.value;
        }
        else {
            if (binder.owner.nodeName == 'OPTION') {
                const parent = binder.owner?.parentElement?.nodeName === 'SELECT' ? binder.owner.parentElement :
                    binder.owner?.parentElement?.parentElement?.nodeName === 'SELECT' ? binder.owner.parentElement.parentElement :
                        binder.owner?.[utility.parent]?.nodeName === 'SELECT' ? binder.owner[utility.parent] :
                            null;
                const value = utility.value in parent ? parent[utility.value] : parent.value;
                if (value === computed)
                    binder.owner.selected = true;
            }
            display = valueDisplay(computed);
            binder.owner.value = display;
        }
        binder.owner[utility.value] = computed;
        binder.owner.setAttribute('value', display);
    },
    reset(binder) {
        if (binder.meta.type === 'select-one' || binder.meta.type === 'select-multiple') {
            for (const option of binder.owner.options) {
                option.selected = false;
            }
        }
        binder.owner.value = '';
        binder.owner.setAttribute('value', '');
        binder.owner[utility.value] = undefined;
    }
};

var Text = {
    async render(binder) {
        const data = binder.compute();
        binder.node.nodeValue =
            typeof data == 'string' ? data :
                typeof data == 'undefined' ? '' :
                    typeof data == 'object' ? JSON.stringify(data) : data;
    },
    async reset(binder) {
        binder.node.nodeValue = '';
    }
};

var Html = {
    render(binder) {
        let data = binder.compute();
        let fragment, node;
        if (typeof data == 'string') {
            const template = document.createElement('template');
            template.innerHTML = data;
            fragment = template.content;
        }
        else if (data instanceof HTMLTemplateElement) {
            fragment = data.content.cloneNode(true);
        }
        else {
            return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
        }
        node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.container.release(node);
            node = binder.owner.lastChild;
        }
        node = fragment.firstChild;
        while (node) {
            binder.container.register(node, binder.context);
            node = node.nextSibling;
        }
        binder.owner.appendChild(fragment);
    },
    reset(binder) {
        let node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.container.release(node);
            node = binder.owner.lastChild;
        }
    }
};

const whitespace = /\s+/;
var Each = {
    setup(binder) {
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateLength = 0;
        binder.meta.queueElement = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');
        let node = binder.owner.firstChild;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue)) {
                binder.owner.removeChild(node);
            }
            else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }
    },
    async reset(binder) {
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        const tasks = [];
        while (binder.owner.lastChild)
            tasks.push(binder.release(binder.owner.removeChild(binder.owner.lastChild)));
        while (binder.meta.queueElement.content.lastChild)
            binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
        await Promise.all(tasks);
    },
    async render(binder) {
        const tasks = [];
        const [data, variable, key, index] = binder.compute();
        const [reference] = binder.references;
        binder.meta.data = data;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variable = variable;
        binder.meta.reference = reference;
        if (data?.constructor === Array) {
            binder.meta.targetLength = data.length;
        }
        else if (data?.constructor === Object) {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }
        else {
            return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
        }
        if (binder.meta.currentLength > binder.meta.targetLength) {
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength, node;
                while (count--) {
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
        }
        else if (binder.meta.currentLength < binder.meta.targetLength) {
            let clone, context, rewrites;
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
                const indexValue = binder.meta.currentLength++;
                rewrites = [
                    ...binder.rewrites,
                    [binder.meta.variable, `${binder.meta.reference}.${keyValue}`]
                ];
                context = new Proxy(binder.context, {
                    has: (target, key) => key === binder.meta.variable ||
                        key === binder.meta.keyName ||
                        key === binder.meta.indexName ||
                        Reflect.has(target, key),
                    get: (target, key, receiver) => key === binder.meta.keyName ? keyValue :
                        key === binder.meta.indexName ? indexValue :
                            key === binder.meta.variable ? Reflect.get(binder.meta.data, keyValue) :
                                Reflect.get(target, key, receiver),
                    set: (target, key, value, receiver) => key === binder.meta.keyName ? true :
                        key === binder.meta.indexName ? true :
                            key === binder.meta.variable ? Reflect.set(binder.meta.data, keyValue, value) :
                                Reflect.set(target, key, value, receiver)
                });
                let node = binder.meta.templateElement.content.firstChild;
                while (node) {
                    clone = node.cloneNode(true);
                    clone[utility.parent] = binder.owner;
                    tasks.push(binder.container.register(clone, context, rewrites));
                    binder.meta.queueElement.content.appendChild(clone);
                    node = node.nextSibling;
                }
            }
            if (binder.meta.currentLength === binder.meta.targetLength) {
                await Promise.all(tasks);
                binder.owner.appendChild(binder.meta.queueElement.content);
            }
        }
    }
};

const onValue = function (element) {
    if (!element)
        return undefined;
    if (utility.value in element) {
        return utility.parseable(element[utility.value]) ?
            JSON.parse(JSON.stringify(element[utility.value])) :
            element[utility.value];
    }
    if (element.type === 'number' || element.type === 'range') {
        return element.valueAsNumber;
    }
    return element.value;
};
const onSubmit = async function (event, binder) {
    event.preventDefault();
    const form = {};
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements) {
        const { type, name, checked } = element;
        if (!name)
            continue;
        if (type === 'radio' && !checked)
            continue;
        if (type === 'submit' || type === 'button')
            continue;
        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions) {
                value.push(onValue(option));
            }
        }
        else if (type === 'select-one') {
            const [option] = element.selectedOptions;
            value = onValue(option);
        }
        else {
            value = onValue(element);
        }
        let data = form;
        const parts = name.split(/\s*\.\s*/);
        for (let index = 0; index < parts.length; index++) {
            const part = parts[index];
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
        }
    }
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$form = form;
    await binder.compute();
    if (target.hasAttribute('reset')) {
        for (const element of elements) {
            const { type, name } = element;
            if (!name)
                continue;
            else if (type === 'submit' || type === 'button')
                continue;
            else if (type === 'select-one')
                element.selectedIndex = 0;
            else if (type === 'select-multiple')
                element.selectedIndex = -1;
            else if (type === 'radio' || type === 'checkbox')
                element.checked = false;
            else
                element.value = '';
            element.dispatchEvent(new Event('input'));
        }
    }
    return false;
};
const onReset = async function (event, binder) {
    event.preventDefault();
    const target = event.target?.form || event.target;
    const elements = target?.querySelectorAll('[name]');
    for (const element of elements) {
        const { type, name } = element;
        if (!name)
            continue;
        else if (type === 'submit' || type === 'button')
            continue;
        else if (type === 'select-one')
            element.selectedIndex = 0;
        else if (type === 'select-multiple')
            element.selectedIndex = -1;
        else if (type === 'radio' || type === 'checkbox')
            element.checked = false;
        else
            element.value = '';
        element.dispatchEvent(new Event('input'));
    }
    binder.instance.event = event;
    binder.instance.$event = event;
    await binder.compute();
    return false;
};
var On = {
    setup(binder) {
        binder.owner[binder.name] = undefined;
        binder.meta.name = binder.name.slice(2);
    },
    render(binder) {
        if (binder.meta.method) {
            binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
        }
        binder.meta.method = (event) => {
            if (binder.meta.name === 'reset') {
                return onReset(event, binder);
            }
            else if (binder.meta.name === 'submit') {
                return onSubmit(event, binder);
            }
            else {
                binder.instance.event = event;
                binder.instance.$event = event;
                return binder.compute();
            }
        };
        binder.owner.addEventListener(binder.meta.name, binder.meta.method);
    },
    reset(binder) {
        if (binder.meta.method) {
            binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
        }
    }
};

const referencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const stringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const assignmentPattern = /\(.*?([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)\)/;
const ignorePattern = new RegExp(`
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
true|false|null|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
(([.][a-zA-Z0-9$_.? ]*)?\\b)
`.replace(/\t|\n/g, ''), 'g');
const Cache = new Map();
function Binder(node, container, context, rewrites) {
    const value = node.nodeValue ?? '';
    const name = node.nodeType === Node.ATTRIBUTE_NODE ? node.name :
        node.nodeType === Node.TEXT_NODE ? 'text' : node.nodeName;
    node.nodeValue = '';
    let handler;
    if (name === 'text')
        handler = Text;
    else if (name === 'html')
        handler = Html;
    else if (name === 'each')
        handler = Each;
    else if (name === 'value')
        handler = Value;
    else if (name === 'inherit')
        handler = Inherit;
    else if (name === 'checked')
        handler = Checked;
    else if (name.startsWith('on'))
        handler = On;
    else
        handler = Standard;
    const binder = {
        name, value,
        node, handler,
        context, container,
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render,
        references: new Set(),
        meta: {}, instance: {},
        rewrites: rewrites ? [...rewrites] : [],
        owner: node.ownerElement ?? node,
    };
    binder.setup?.(binder);
    let cache = Cache.get(binder.value);
    if (!cache) {
        const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
        const clean = code.replace(stringPattern, '');
        const assignment = clean.match(assignmentPattern);
        const references = clean.replace(ignorePattern, '').match(referencePattern) ?? [];
        const isValue = name === 'value';
        const isChecked = name === 'checked';
        const compute = new Function('$context', '$instance', `
        with ($context) {
            with ($instance) {
                ${assignment && isValue ? `$value = $assign ? $value : ${assignment?.[1]};` : ''}
                ${assignment && isChecked ? `$checked = $assign ? $checked : ${assignment?.[1]};` : ''}
                return ${assignment ? `$assign ? ${code} : ${assignment?.[3]}` : code};
            }
        }
        `);
        cache = { compute, references };
        Cache.set(value, cache);
    }
    let reference, nameRewrite, valueRewrite;
    for (reference of cache.references) {
        if (rewrites) {
            for ([nameRewrite, valueRewrite] of rewrites) {
                reference = reference === nameRewrite ? valueRewrite :
                    reference.startsWith(nameRewrite + '.') ? valueRewrite + reference.slice(nameRewrite.length) :
                        reference;
            }
        }
        binder.references.add(reference);
    }
    binder.compute = cache.compute.bind(binder.owner ?? binder.node, binder.context, binder.instance);
    return binder;
}

async function Poly() {
    if ('shadowRoot' in HTMLTemplateElement.prototype === false) {
        (function attachShadowRoots(root) {
            const templates = root.querySelectorAll('template[shadowroot]');
            for (const template of templates) {
                const mode = (template.getAttribute('shadowroot') || 'closed');
                const shadowRoot = template.parentNode.attachShadow({ mode });
                shadowRoot.appendChild(template.content);
                template.remove();
                attachShadowRoots(shadowRoot);
            }
        })(document);
    }
    if ('navigation' in window === false) {
        window.navigation = new (await import('https://cdn.skypack.dev/@virtualstate/navigation')).Navigation;
    }
}

class XElement extends HTMLElement {
    static poly = Poly;
    static navigation = navigation;
    static syntaxLength = 2;
    static syntaxEnd = '}}';
    static syntaxStart = '{{';
    static syntaxMatch = new RegExp('{{.*?}}');
    static observedProperties;
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
    get isPrepared() { return this.#prepared; }
    #prepared = false;
    #preparing = false;
    #updates = new Set();
    #binders = new Map();
    #mutator = new MutationObserver(this.#mutation.bind(this));
    #context = new Proxy({}, {
        get: ContextGet.bind(null, this.#change.bind(this), ''),
        set: ContextSet.bind(null, this.#change.bind(this), ''),
        deleteProperty: ContextDelete.bind(null, this.#change.bind(this), '')
    });
    constructor() {
        super();
        if (!this.shadowRoot)
            this.attachShadow({ mode: 'open' });
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe(this.shadowRoot, { childList: true });
    }
    async #change(reference, type) {
        console.log('change start');
        let key, binder, binders;
        let tasks = [];
        for ([key, binders] of this.#binders) {
            if (binders && key == reference || key?.startsWith?.(`${reference}.`)) {
                for (binder of binders) {
                    tasks.push(binder);
                }
            }
        }
        await Promise.all(tasks.map(async function changePromiseAll(binder) {
            return binder[type](binder);
        }));
        console.log('change end');
    }
    #mutation(mutations) {
        console.log('mutation');
        if (this.#prepared) {
            let mutation, node;
            for (mutation of mutations) {
                for (node of mutation.addedNodes) {
                    this.register(node, this.#context, []);
                }
                for (node of mutation.removedNodes) {
                    this.release(node);
                }
            }
        }
        else {
            this.prepare();
        }
    }
    #remove(node) {
        const binders = this.#binders.get(node);
        if (!binders)
            return;
        let binder, reference;
        for (binder of binders) {
            for (reference of binder.references) {
                if (this.#binders.has(reference)) {
                    this.#binders.get(reference)?.delete(binder);
                    if (!this.#binders.get(reference)?.size)
                        this.#binders.delete(reference);
                }
            }
        }
        this.#binders.delete(node);
    }
    async #add(node, context, rewrites) {
        const binder = Binder(node, this, context, rewrites);
        let binders, reference;
        for (reference of binder.references) {
            binders = this.#binders.get(reference);
            if (binders) {
                binders.add(binder);
            }
            else {
                this.#binders.set(reference, new Set([binder]));
            }
        }
        const nodes = this.#binders.get(binder.owner ?? binder.node);
        if (nodes) {
            nodes.add(binder);
        }
        else {
            this.#binders.set(binder.owner ?? binder.node, new Set([binder]));
        }
        await binder.render(binder);
    }
    async prepare() {
        console.log('prepare');
        if (this.#prepared || this.#preparing)
            return;
        this.#preparing = true;
        this.dispatchEvent(XElement.preparingEvent);
        const prototype = Object.getPrototypeOf(this);
        const properties = this.constructor.observedProperties;
        const descriptors = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };
        for (const property in descriptors) {
            if (properties && !properties?.includes(property) ||
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'constructor' === property ||
                property.startsWith('#'))
                continue;
            const descriptor = descriptors[property];
            if (!descriptor.configurable)
                continue;
            if (descriptor.set)
                descriptor.set = descriptor.set?.bind(this);
            if (descriptor.get)
                descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function')
                descriptor.value = descriptor.value.bind(this);
            Object.defineProperty(this.#context, property, descriptor);
            Object.defineProperty(this, property, {
                enumerable: descriptor.enumerable,
                configurable: descriptor.configureable,
                get: () => this.#context[property],
                set: (value) => this.#context[property] = value
            });
        }
        await this.register(this.shadowRoot, this.#context);
        await this.register(this, this.#context);
        this.#prepared = true;
        this.dispatchEvent(XElement.preparedEvent);
    }
    async release(node) {
        const tasks = [];
        if (node.nodeType == Node.TEXT_NODE) {
            tasks.push(this.#remove(node));
        }
        else if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while (child) {
                tasks.push(this.release(child));
                child = child.nextSibling;
            }
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            tasks.push(this.#remove(node));
            let attribute;
            for (attribute of node.attributes) {
                tasks.push(this.#remove(attribute));
            }
            let child = node.firstChild;
            while (child) {
                tasks.push(this.release(child));
                child = child.nextSibling;
            }
        }
        await Promise.all(tasks);
    }
    async register(node, context, rewrites) {
        const tasks = [];
        if (node.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild;
            while (child) {
                tasks.push(this.register(child, context, rewrites));
                child = child.nextSibling;
            }
        }
        else if (node.nodeType == node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf(XElement.syntaxStart) ?? -1;
            if (start == -1)
                return;
            if (start != 0)
                node = node.splitText(start);
            const end = node.nodeValue?.indexOf(XElement.syntaxEnd) ?? -1;
            if (end == -1)
                return;
            if (end + XElement.syntaxLength != node.nodeValue?.length) {
                tasks.push(this.register(node.splitText(end + XElement.syntaxLength), context, rewrites));
            }
            tasks.push(this.#add(node, context, rewrites));
        }
        else if (node.nodeType == node.ELEMENT_NODE) {
            let attribute, inherit, each;
            each = node.attributes.each;
            inherit = node.attributes.inherit;
            for (attribute of node.attributes) {
                if (XElement.syntaxMatch.test(attribute.value)) {
                    tasks.push(this.#add(attribute, context, rewrites));
                }
            }
            if (!each && !inherit) {
                let child = node.firstChild;
                while (child) {
                    tasks.push(this.register(child, context, rewrites));
                    child = child.nextSibling;
                }
            }
        }
        await Promise.all(tasks);
    }
    adoptedCallback() {
        this.dispatchEvent(XElement.adoptingEvent);
        this.adopted?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }
    connectedCallback() {
        this.dispatchEvent(XElement.connectingEvent);
        this.connected?.();
        this.dispatchEvent(XElement.connectedEvent);
    }
    disconnectedCallback() {
        this.dispatchEvent(XElement.disconnectingEvent);
        this.disconnected?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }
    attributeChangedCallback(name, from, to) {
        this.dispatchEvent(XElement.attributingEvent);
        this.attributed?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }
}

export { XElement as default };
