// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

new Map();
const Path = Symbol('Path');
const RewriteName = Symbol('RewriteName');
const RewriteValue = Symbol('RewriteValue');
const Resolve = function(item, method) {
    return Promise.resolve(item).then(method);
};
const ContextEvent = function([binders, path, binder]) {
    const nodes = binders.get(path) ?? binders.set(path, new Set()).get(path);
    const iterator = nodes.values();
    let result = iterator.next();
    while(!result.done){
        if (binder !== result.value) {
            Resolve(result.value, async (binder)=>await binder?.render());
        }
        result = iterator.next();
    }
};
const ContextSet = function(binder, binders, path, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    Reflect.set(target, key, value, receiver);
    if (key === target[RewriteName]) {
        path = path ? `${path}.${target[RewriteValue]}` : target[RewriteValue];
    } else {
        path = path ? `${path}.${key}` : key;
    }
    if (binder) {
        if (binders.has(path)) {
            binders.get(path).add(binder);
        } else {
            binders.set(path, new Set([
                binder
            ]));
        }
    }
    Resolve([
        binders,
        path,
        binder
    ], ContextEvent);
    return true;
};
const ContextGet = function(binder, binders, path, target, key, receiver) {
    if (key === Path) return path;
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    if (key === target[RewriteName]) {
        path = path ? `${path}.${target[RewriteValue]}` : target[RewriteValue];
    } else {
        path = path ? `${path}.${key}` : key;
    }
    if (binder) {
        if (binders.has(path)) {
            binders.get(path).add(binder);
        } else {
            binders.set(path, new Set([
                binder
            ]));
        }
    }
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        let proxy;
        proxy = new Proxy(value, {
            get: ContextGet.bind(null, binder, binders, path),
            set: ContextSet.bind(null, binder, binders, path)
        });
        return proxy;
    }
    return value;
};
const Context = function(data, binders, path, binder) {
    return new Proxy(data, {
        get: ContextGet.bind(null, binder, binders, path),
        set: ContextSet.bind(null, binder, binders, path)
    });
};
const promise = Promise.resolve();
new Map();
const Path1 = Symbol('Path');
const RewriteName1 = Symbol('RewriteName');
const RewriteValue1 = Symbol('RewriteValue');
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
const ComputeCache = new Map();
const Compute = function(code) {
    const cache = ComputeCache.get(code);
    if (cache) return cache;
    const method = new Function('$context', '$instance', `with ($context) { with ($instance) {
            return (${code});
        } }`);
    ComputeCache.set(code, method);
    return method;
};
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
        binder.owner.setAttribute(binder.name, data2);
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
const checkedEvent = new CustomEvent('xRadioInputHandler');
const checkedHandler = async function(event, binder) {
    const owner = binder.owner;
    const checked = event === undefined ? undefined : owner.checked;
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = !!event;
    binder.instance.$checked = checked;
    binder.instance.$render = event ? false : true;
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
    console.log('valueInput');
    if (binder.meta.busy) return;
    else binder.meta.busy = true;
    binder.instance.event = event;
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
            if (event.data) binder.meta.value += event.data;
            else binder.meta.value = '';
            console.log(binder.meta.value);
            binder.instance.$value = owner.value;
        }
        if (owner.type === 'checkbox' || owner.type === 'radio') {
            binder.instance.$checked = owner.checked;
        }
    }
    const computed = await binder.compute();
    const display = toolDefault.display(computed);
    owner.value = display;
    owner.setAttribute('value', display);
    binder.meta.busy = false;
    binder.instance.event = undefined;
};
const valueSetup = function(binder) {
    binder.owner.value = '';
    binder.owner.addEventListener('input', (event)=>valueInput(binder, event));
};
const valueRender = async function(binder) {
    console.log('valueRender', binder.meta.busy);
    if (binder.meta.busy) return;
    else binder.meta.busy = true;
    binder.instance.event = undefined;
    const owner = binder.owner;
    const computed = await binder.compute();
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
    owner.setAttribute('value', display);
    binder.meta.busy = false;
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
const onSetup = function(binder) {
    binder.owner[binder.name] = undefined;
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
const BinderCreate = function(context, binders, attribute) {
    let { name , value , ownerElement  } = attribute;
    if (name.startsWith('x-')) {
        name = name.slice(2);
    }
    if (value.startsWith('{{') && value.endsWith('}}')) {
        value = value.slice(2, -2);
    }
    let handler;
    if (name === 'html') handler = htmlDefault;
    else if (name === 'each') handler = eachDefault;
    else if (name === 'value') handler = valueDefault;
    else if (name === 'checked') handler = checkedDefault;
    else if (name === 'inherit') handler = inheritDefault;
    else if (name.startsWith('on')) handler = onDefault;
    else handler = standardDefault;
    const binder = {
        name,
        value,
        binders,
        meta: {},
        instance: {},
        owner: ownerElement,
        setup: undefined,
        reset: undefined,
        render: undefined,
        compute: undefined,
        context: undefined
    };
    binder.reset = handler.reset.bind(null, binder);
    binder.render = handler.render.bind(null, binder);
    binder.setup = handler?.setup?.bind(null, binder);
    binder.owner.removeAttributeNode(attribute);
    binder.context = Context(context, binders, '', binder);
    binder.compute = Compute(value).bind(binder.owner, binder.context, binder.instance);
    binder.setup?.(binder);
    return binder;
};
const BinderHandle = async function(context, binders, element) {
    const tasks = [];
    let each = false;
    for (const attribute of element.attributes){
        const { name , value  } = attribute;
        if (value.startsWith('{{') && value.endsWith('}}')) {
            each = name === 'each' || name === 'x-each';
            tasks.push(BinderCreate(context, binders, attribute).render());
        }
    }
    if (!each) {
        let child = element.firstElementChild;
        while(child){
            tasks.push(BinderHandle(context, binders, child));
            child = child.nextElementSibling;
        }
    }
    await Promise.all(tasks);
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
        node = binder.owner.lastChild;
    }
    node = fragment.firstChild;
    while(node){
        tasks.push(BinderHandle(binder.context, binder.binders, node));
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
const eachSetup = function(binder) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');
    let node = binder.owner.firstChild;
    while(node){
        if (node.nodeType === Node.ELEMENT_NODE) {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
        } else {
            binder.owner.removeChild(node);
        }
        node = binder.owner.firstChild;
    }
};
const eachRender = async function(binder) {
    if (binder.meta.busy) console.log(binder);
    if (binder.meta.busy) return;
    else binder.meta.busy = true;
    const tasks = [];
    const [data, variable, key, index] = await binder.compute();
    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variable = variable;
    binder.meta.reference = Reflect.get(data, Path1);
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
                node = binder.owner.lastElementChild;
                if (node) {
                    binder.owner.removeChild(node);
                }
            }
            binder.meta.currentLength--;
        }
        if (binder.meta.currentLength === binder.meta.targetLength) {}
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, context;
        while(binder.meta.currentLength < binder.meta.targetLength){
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;
            context = new Proxy(binder.context, {
                has: function eachHas(target, key) {
                    if (key === binder.meta.keyName) return true;
                    if (key === binder.meta.indexName) return true;
                    if (key === binder.meta.variable) return true;
                    return Reflect.has(target, key);
                },
                get: function eachGet(target, key, receiver) {
                    if (key === RewriteName1) return binder.meta.variable;
                    if (key === RewriteValue1) return `${binder.meta.reference}.${keyValue}`;
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
            let node1 = binder.meta.templateElement.content.firstElementChild;
            while(node1){
                clone = node1.cloneNode(true);
                tasks.push(BinderHandle(context, binder.binders, clone));
                binder.meta.queueElement.content.appendChild(clone);
                node1 = node1.nextElementSibling;
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
    while(binder.owner.lastChild)binder.container.release(binder.owner.removeChild(binder.owner.lastChild));
    while(binder.meta.queueElement.content.lastChild)binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
};
const eachDefault = {
    setup: eachSetup,
    render: eachRender,
    reset: eachReset
};
const navigators = new Map();
const transition = async function(options) {
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
    #context = Context({}, this.#binders, '', undefined);
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
        let child = this.shadowRoot?.firstElementChild;
        while(child){
            promises.push(BinderHandle(this.#context, this.#binders, child));
            child = child.nextElementSibling;
        }
        const slots = this.shadowRoot?.querySelectorAll('slot') ?? [];
        for (const slot of slots){
            const elements = slot.assignedElements();
            for (const element of elements){
                promises.push(BinderHandle(this.#context, this.#binders, element));
            }
        }
        await Promise.all(promises);
        this.#prepared = true;
        this.#preparing = false;
        this.dispatchEvent(XElement.preparedEvent);
    }
    async slottedCallback(event) {
        console.log('slottedCallback');
        const promises = [];
        const slot = event.target;
        const elements = slot?.assignedElements();
        for (const element of elements){
            promises.push(BinderHandle(this.#context, this.#binders, element));
        }
        await Promise.all(promises);
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
