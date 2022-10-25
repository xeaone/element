// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

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
Object.freeze({
    parseable,
    display,
    dash
});
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
const vNode = function(tag = '', attributes = {}, children = []) {
    if (!tag || tag?.constructor !== String) throw new Error('tag String required');
    if (attributes?.constructor !== Object) throw new Error('attributes Object required');
    if (children?.constructor !== Array) throw new Error('children Array required');
    return {
        tag,
        attributes,
        children
    };
};
const Render = function(node) {
    if (typeof node === 'string') {
        return document.createTextNode(node);
    } else if (node.tag === '#text') {
        return document.createTextNode(node.children[0]);
    } else {
        const { tag , attributes , children  } = node;
        const element = document.createElement(tag);
        for(const name in attributes)element.setAttribute(name, attributes[name]);
        for (const child of children)element.appendChild(Render(child));
        return element;
    }
};
const Patch = (source, target, node)=>{
    if (target === undefined) {
        node.parentNode?.removeChild(node);
        return;
    } else if (typeof source === 'string' || typeof target === 'string') {
        if (source !== target) {
            node.parentNode?.replaceChild(Render(target), node);
        }
    } else if (source.tag !== target.tag) {
        node.parentNode?.replaceChild(Render(target), node);
    } else if (node instanceof Element) {
        for(const name in target.attributes){
            const value = target.attributes[name];
            node.setAttribute(name, value);
        }
        for(const name1 in source.attributes){
            if (!(name1 in target.attributes)) {
                node.removeAttribute(name1);
            }
        }
        const sourceLength = source.children.length;
        const targetLength = target.children.length;
        const commonLength = Math.min(sourceLength, targetLength);
        for(let index = 0; index < commonLength; index++){
            Patch(source.children[index], target.children[index], node.childNodes[index]);
        }
        if (sourceLength > targetLength) {
            for(let index1 = targetLength; index1 < sourceLength; index1++){
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (sourceLength < targetLength) {
            for(let index2 = sourceLength; index2 < targetLength; index2++){
                const child1 = target.children[index2];
                node.appendChild(Render(child1));
            }
        }
    }
};
const escape = function(name, value) {
    if (name.startsWith('on') || name.startsWith('value') || name.startsWith('each')) return `"${value}"`;
    if (value) console.log(value);
    return '"' + value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/^{{/, '"+(').replace(/}}$/, ')+"').replace(/{{/g, '"+(').replace(/}}/g, ')+"').concat('"');
};
const Virtualize = function(node) {
    const nodeType = node.nodeType;
    const nodeName = node.nodeName.toLowerCase();
    let nodeChildren = '';
    if (nodeType === Node.TEXT_NODE) {
        const value = node.nodeValue ?? '';
        nodeChildren = `[${escape('text', value)}]`;
    } else if (node.hasChildNodes?.()) {
        let child = node.firstChild;
        while(child){
            nodeChildren += `${Virtualize(child)},`;
            child = child.nextSibling;
        }
        nodeChildren = `[${nodeChildren}]`;
    }
    let nodeAttributes = '';
    if (node.hasAttributes?.()) {
        const attributes = node.attributes;
        for (const { name , value: value1  } of attributes){
            nodeAttributes += `"${name}":${escape(name, value1)},`;
        }
    }
    return `$X.node("${nodeName}",{${nodeAttributes}},${nodeChildren})`;
};
const Compile = function(virtual) {
    const code = [
        'return function Compiled ($context) {',
        'console.log($X);',
        'with ($context) {',
        'return [',
        `\t\t\t${virtual.join(',\n\t\t')}`,
        '];',
        '}}', 
    ].join('\n');
    return new Function('$X', code)({
        node: vNode,
        patch: Patch
    });
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
        const promises = [
            undefined
        ];
        if (this.shadowRoot) {
            const slots = this.shadowRoot.querySelectorAll('slot');
            const roots = [];
            const virtual = [];
            for (const node of this.shadowRoot.childNodes){
                virtual.push(Virtualize(node));
                roots.push(node);
            }
            for (const slot of slots){
                const nodes = slot.assignedNodes();
                for (const node1 of nodes){
                    virtual.push(Virtualize(node1));
                    roots.push(node1);
                }
            }
            const compiled = Compile(virtual);
            const sources = compiled(this.#context);
            const targets = compiled(this.#context);
            const l = roots.length;
            for(let i = 0; i < l; i++){
                Patch(sources[i], targets[i], roots[i]);
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
