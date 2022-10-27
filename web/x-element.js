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
const ContextEvent = async function([binders, path, event]) {};
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
const textType = Node.TEXT_NODE;
const elementType = Node.ELEMENT_NODE;
const commentType = Node.COMMENT_NODE;
const cdataType = Node.CDATA_SECTION_NODE;
Node.DOCUMENT_FRAGMENT_NODE;
const escape = function(value) {
    return value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/^\s*{{/, '(').replace(/}}\s*$/, ')').replace(/{{/g, '"+(').replace(/}}/g, ')+"');
};
const handle = function(name, value) {
    if (name === '#text') {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            return `""+${escape(value)}+""`;
        } else {
            return `"${escape(value)}"`;
        }
    } else {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            if (name.startsWith('on')) {
                return `"${name}":function(event){return${escape(value)}},`;
            } else {
                return `"${name}":""+${escape(value)}+"",`;
            }
        } else {
            return `"${name}":"${escape(value)}",`;
        }
    }
};
const create = function(tag, type, attributes = {}, children) {
    return {
        tag,
        type,
        attributes,
        children
    };
};
const render = function(item) {
    if (typeof item === 'string') {
        return document.createTextNode(item);
    } else if (item.tag === '#text') {
        return document.createTextNode(item.children);
    } else if (item.tag === '#comment') {
        return document.createComment(item.children);
    } else if (item.tag === '#cdata-section') {
        return document.createCDATASection(item.children);
    } else {
        const { tag , attributes , children  } = item;
        const element = document.createElement(tag);
        for(const name in attributes){
            const value = attributes[name];
            if (typeof value === 'string') {
                element.setAttribute(name, attributes[name]);
            } else {
                Reflect.set(element, name, value);
            }
        }
        for (const child of children){
            element.appendChild(render(child));
        }
        return element;
    }
};
const patch = function(source, target, node) {
    if (target === undefined) {
        console.warn('target undefined');
        node.parentNode?.removeChild(node);
        return;
    } else if (typeof source === 'string' || typeof target === 'string') {
        console.warn('typeof source or target equal string');
        if (source !== target) {
            node.parentNode?.replaceChild(render(target), node);
        }
    } else if (source.tag !== target.tag || source.type !== target.type) {
        node.parentNode?.replaceChild(render(target), node);
    } else if (source.type === textType || target.type === textType || source.type === cdataType || target.type === cdataType || source.type === commentType || target.type === commentType) {
        if (source.children !== target.children) {
            node.parentNode?.replaceChild(render(target), node);
        }
    } else {
        if (node.nodeType !== elementType) {
            throw new Error('wrong type');
        }
        for(const name in target.attributes){
            const value = target.attributes[name];
            if (typeof value === 'string') {
                node.setAttribute(name, value);
            } else {
                Reflect.set(node, name, value);
            }
        }
        for(const name1 in source.attributes){
            const value1 = target.attributes[name1];
            if (typeof value1 !== 'string') {
                node.removeAttribute(name1);
            }
        }
        const targetChildren = target.children;
        const sourceChildren = source.children;
        const sourceLength = sourceChildren.length;
        const targetLength = targetChildren.length;
        const commonLength = Math.min(sourceLength, targetLength);
        for(let index = 0; index < commonLength; index++){
            patch(sourceChildren[index], targetChildren[index], node.childNodes[index]);
        }
        if (sourceLength > targetLength) {
            for(let index1 = targetLength - 1; index1 < sourceLength; index1++){
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (sourceLength < targetLength) {
            for(let index2 = sourceLength - 1; index2 < targetLength; index2++){
                const child1 = target.children[index2];
                node.appendChild(render(child1));
            }
        }
    }
};
const tree = function(node) {
    const nodeType = node.nodeType;
    const nodeValue = node.nodeValue ?? '';
    const nodeName = node.nodeName.toLowerCase();
    if (nodeType === textType) {
        const value = node.nodeValue ?? '';
        const sChildren = handle(nodeName, value);
        return [
            `$create("${nodeName}",${nodeType},{},${sChildren})`,
            create(nodeName, nodeType, {}, nodeValue), 
        ];
    } else if (nodeType === elementType) {
        let sChildren1 = '';
        let sAttributes = '';
        const pChildren = [];
        const pAttributes = {};
        if (node.hasChildNodes()) {
            let child = node.firstChild;
            while(child){
                const [stringified, parsed] = tree(child);
                sChildren1 += `${stringified},`;
                pChildren.push(parsed);
                child = child.nextSibling;
            }
            sChildren1 = `${sChildren1}`;
        }
        if (node.hasAttributes?.()) {
            const attributes = node.attributes;
            for (const { name , value: value1  } of attributes){
                pAttributes[name] = value1;
                sAttributes += handle(name, value1);
            }
        }
        return [
            `$create("${nodeName}",${nodeType},{${sAttributes}},[${sChildren1}])`,
            create(nodeName, nodeType, pAttributes, pChildren), 
        ];
    } else if (commentType || cdataType) {
        return [
            `$create("${nodeName}",${nodeType},{},${nodeValue})`,
            create(nodeName, nodeType, {}, nodeValue), 
        ];
    } else {
        throw new Error('Node type not handled');
    }
};
const compile = function(virtual) {
    const code = [
        'return function Render ($context) {',
        'console.log($context.count);',
        'with ($context) {',
        'return [',
        `\t${virtual.join(',\n\t')}`,
        '];',
        '}}', 
    ].join('\n');
    return new Function('$create', code)(create);
};
const whitespace = /^\s*$/;
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
    #roots;
    #virtual;
    #sources;
    #targets;
    #render;
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
            this.#roots = [];
            this.#virtual = [];
            const parsed = [];
            const stringified = [];
            for (const node of this.shadowRoot.childNodes){
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue && whitespace.test(node.nodeValue)) {
                    this.shadowRoot.removeChild(node);
                } else {
                    const [s, p] = tree(node);
                    parsed.push(p);
                    stringified.push(s);
                    this.#roots.push(node);
                }
            }
            for (const slot of slots){
                const nodes = slot.assignedNodes();
                for (const node1 of nodes){
                    if (node1.nodeType === Node.TEXT_NODE && node1.nodeValue && whitespace.test(node1.nodeValue)) {
                        node1?.parentNode?.removeChild(node1);
                    } else {
                        const [s1, p1] = tree(node1);
                        parsed.push(p1);
                        stringified.push(s1);
                        this.#roots.push(node1);
                    }
                }
            }
            this.#sources = parsed;
            this.#render = compile(stringified);
            this.#targets = this.#render(this.#context);
            for(let i = 0; i < this.#roots.length; i++){
                patch(this.#sources[i], this.#targets[i], this.#roots[i]);
            }
            this.#sources = this.#targets;
            setInterval(()=>{
                this.#targets = this.#render(this.#context);
                for(let i = 0; i < this.#roots.length; i++){
                    patch(this.#sources[i], this.#targets[i], this.#roots[i]);
                }
                this.#sources = this.#targets;
            }, 1000);
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
