// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const whitespace = /^\s*$/;
const textType = Node.TEXT_NODE;
const elementType = Node.ELEMENT_NODE;
const commentType = Node.COMMENT_NODE;
Node.DOCUMENT_NODE;
const cdataType = Node.CDATA_SECTION_NODE;
Node.DOCUMENT_FRAGMENT_NODE;
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
    await customElements.whenDefined(options.name);
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
const ContextSet = function(method, path, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (key === 'length') {
        Promise.resolve([
            path,
            'set'
        ]).then(method);
        Promise.resolve([
            path ? `${path}.${key}` : key,
            'set'
        ]).then(method);
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
    Promise.resolve([
        path,
        'set'
    ]).then(method);
    return true;
};
const ContextGet = function(method, path, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && (value.constructor === Array || value.constructor === Object)) {
        path = path ? `${path}.${key}` : key;
        const cache = Cache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, method, path),
            set: ContextSet.bind(null, method, path),
            deleteProperty: ContextDelete.bind(null, method, path)
        });
        Cache.set(value, proxy);
        return proxy;
    }
    return value;
};
const ContextDelete = function(method, path, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    const from = Reflect.get(target, key);
    Cache.delete(from);
    Reflect.deleteProperty(target, key);
    path = path ? `${path}.${key}` : key;
    Promise.resolve([
        path,
        'delete'
    ]).then(method);
    return true;
};
const ContextCreate = function(data, method, path = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, method, path),
        set: ContextSet.bind(null, method, path),
        deleteProperty: ContextDelete.bind(null, method, path)
    });
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
    'visible'
]);
const dateDefault = Object.freeze([
    'datetime-local',
    'date',
    'month',
    'time',
    'week'
]);
const quotes = function(value) {
    return value.replace(/"/g, '\\"');
};
const lines = function(value) {
    return value.replace(/\n/g, '\\n');
};
const escape = function(value) {
    return '(' + value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/^\s*{{/, '').replace(/}}\s*$/, '').replace(/{{/g, '"+(').replace(/}}/g, ')+"') + ')';
};
const compute = function(name, value) {
    if (name === 'value') {
        return function(element) {
            const type = Reflect.get(element, 'type');
            if (typeof value === 'number' && dateDefault.includes(type)) {
                const iso = new Date(value).toLocaleString('default', {
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 3
                }).replace(/(\d+)\/(\d+)\/(\d+), ([0-9:.]+)/, '$3-$1-$2T$4Z');
                if (type === 'date') value = iso.slice(0, 10);
                else if (type === 'time') value = iso.slice(11, -1);
                else if (type === 'month') value = iso.slice(0, 7);
                else if (type === 'datetime-local') value = iso.slice(0, -1);
            }
            value = `${value == undefined ? '' : value}`;
            Reflect.set(element, name, value);
            element.setAttribute(name, value);
        };
    } else if (name.startsWith('on')) {
        return function(element) {
            if (Reflect.has(element, `x${name}`)) {
                element.addEventListener(name.slice(2), Reflect.get(element, `x${name}`));
            } else {
                Reflect.set(element, `x${name}`, value);
                element.addEventListener(name.slice(2), value);
            }
            if (element.hasAttribute(name)) element.removeAttribute(name);
        };
    } else if (booleanDefault.includes(name)) {
        return function(element) {
            const result = value ? true : false;
            Reflect.set(element, name, result);
            if (result) element.setAttribute(name, '');
            else element.removeAttribute(name);
        };
    } else {
        return value;
    }
};
const eachParametersPattern = /^\s*{{\s*\[\s*(.*?)(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?(?:\s*,\s*[`'"]([^`'"]+)[`'"])?\s*\]\s*}}\s*$/;
const eachCompile = function(children, value) {
    const [_, items, item, key, index] = value.match(eachParametersPattern) ?? [];
    const parameters = item && key && index ? [
        item,
        key,
        index
    ] : item && key ? [
        item,
        key
    ] : item ? [
        item
    ] : [];
    return `(${items}).map((${parameters.join(',')})=>${children}).flat()`;
};
const textCompile = function(value) {
    value = quotes(lines(value));
    if (value.includes('{{') && value.includes('}}')) {
        value = value.replace(/{{/g, '"+(').replace(/}}/g, ')+"');
        return `("${value}")`;
    } else {
        return `"${value}"`;
    }
};
const attributeCompile = function(name, value) {
    if (name.startsWith('x-') || value.startsWith('{{') && value.endsWith('}}')) {
        name = name.startsWith('x-') ? name.slice(2) : name;
        if (name.startsWith('on')) {
            return `"${name}":$compute("${name}",function(event){return${escape(value)}}),`;
        } else {
            return `"${name}":$compute("${name}",${escape(value)}),`;
        }
    } else {
        return `"${name}":"${value}",`;
    }
};
const attributesRender = function(element, attributes) {
    for(const name in attributes){
        const value = attributes[name];
        if (typeof value === 'function') {
            value(element);
        } else {
            element.setAttribute(name, value);
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
        for (const child of children){
            element.appendChild(render(child));
        }
        attributesRender(element, attributes);
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
        console.log('tag or type', target, source.tag, target.tag, source.type, target.type);
        node.parentNode?.replaceChild(render(target), node);
    } else if (source.type === textType || target.type === textType || source.type === cdataType || target.type === cdataType || source.type === commentType || target.type === commentType) {
        if (source.children !== target.children) {
            node.parentNode?.replaceChild(render(target), node);
        }
    } else {
        if (node.nodeType !== elementType) {
            throw new Error('wrong type');
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
            for(let index1 = targetLength; index1 < sourceLength; index1++){
                const child = node.lastChild;
                if (child) node.removeChild(child);
            }
        } else if (sourceLength < targetLength) {
            for(let index2 = sourceLength; index2 < targetLength; index2++){
                const child1 = target.children[index2];
                node.appendChild(render(child1));
            }
        }
        attributesRender(node, target.attributes);
        for(const name in source.attributes){
            if (!(name in target.attributes)) {
                node.removeAttribute(name);
            }
        }
    }
};
const tree = function(node) {
    const nodeType = node.nodeType;
    const nodeValue = node.nodeValue ?? '';
    const nodeName = node.nodeName.toLowerCase();
    if (nodeType === textType) {
        if (whitespace.test(nodeValue)) {
            return [
                '',
                create(nodeName, nodeType, {}, nodeValue)
            ];
        } else {
            const sChildren = textCompile(nodeValue);
            return [
                `$create("${nodeName}",${nodeType},{},${sChildren})`,
                create(nodeName, nodeType, {}, nodeValue)
            ];
        }
    }
    if (nodeType === elementType) {
        let sChildren1 = '';
        let sAttributes = '';
        const pChildren = [];
        const pAttributes = {};
        if (node.hasChildNodes()) {
            let child = node.firstChild;
            while(child){
                const [stringified, parsed] = tree(child);
                sChildren1 += stringified ? `${stringified},` : '';
                pChildren.push(parsed);
                child = child.nextSibling;
            }
            sChildren1 = `[${sChildren1}]`;
        }
        if (node.hasAttributes()) {
            const attributes = node.getAttributeNames();
            for (const name of attributes){
                const value = node.getAttribute(name) ?? '';
                if ([
                    'each',
                    'x-each'
                ].includes(name)) {
                    sChildren1 = eachCompile(sChildren1, value);
                } else {
                    sAttributes += attributeCompile(name, value);
                }
                pAttributes[name] = value;
            }
        }
        return [
            `$create("${nodeName}",${nodeType},{${sAttributes}},${sChildren1 || '[]'})`,
            create(nodeName, nodeType, pAttributes, pChildren)
        ];
    }
    if (commentType || cdataType) {
        const children = quotes(lines(nodeValue));
        return [
            `$create("${nodeName}",${nodeType},{},"${children}")`,
            create(nodeName, nodeType, {}, nodeValue)
        ];
    }
    throw new Error('Node type not handled');
};
const compile = function(virtual) {
    const code = [
        'return function Render ($context, $cache) {',
        'with ($context) {',
        'console.log("here");',
        'return [',
        `\t${virtual.join(',\n\t')}`,
        '];',
        '}}'
    ].join('\n');
    return new Function('$cache', '$create', '$compute', code)(new WeakMap(), create, compute);
};
const DEFINED = new WeakSet();
const CE = window.customElements;
Object.defineProperty(window, 'customElements', {
    get: ()=>({
            define (name, constructor, options) {
                if (constructor.prototype instanceof XElement && !DEFINED.has(constructor)) {
                    constructor = new Proxy(constructor, {
                        construct (target, args, extender) {
                            const instance = Reflect.construct(target, args, extender);
                            instance.upgrade();
                            return instance;
                        }
                    });
                    DEFINED.add(constructor);
                }
                CE.define(name, constructor, options);
            },
            get: CE.get,
            whenDefined: CE.whenDefined
        })
});
class XElement extends HTMLElement {
    static observedProperties;
    static navigation = navigation;
    static slottedEvent = new Event('slotted');
    static slottingEvent = new Event('slotting');
    static adoptedEvent = new Event('adopted');
    static adoptingEvent = new Event('adopting');
    static updatedEvent = new Event('updated');
    static updatingEvent = new Event('updating');
    static upgradedEvent = new Event('upgraded');
    static upgradingEvent = new Event('upgrading');
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
    get isUpgraded() {
        return this.#upgraded;
    }
    #shadow;
    #properties = false;
    #updating = false;
    #upgraded = false;
    #upgrading = false;
    #context = ContextCreate({}, this.update.bind(this));
    #roots;
    #render;
    #sources;
    #targets;
    constructor(){
        super();
        this.#shadow = this.shadowRoot ?? this.attachShadow({
            mode: 'open'
        });
        this.#shadow.addEventListener('slotchange', this.slottedCallback.bind(this));
    }
    update() {
        if (this.#updating) return;
        this.#updating = true;
        this.dispatchEvent(XElement.updatingEvent);
        this.#targets = this.#render?.(this.#context);
        for(let i = 0; i < this.#roots.length; i++){
            patch(this.#sources[i], this.#targets[i], this.#roots[i]);
        }
        this.#sources = this.#targets;
        this.#updating = false;
        this.dispatchEvent(XElement.updatedEvent);
    }
    upgrade() {
        console.log('upgraded');
        if (this.#upgraded) return;
        if (this.#upgrading) return new Promise((resolve)=>this.addEventListener('upgraded', ()=>resolve(undefined)));
        this.#upgrading = true;
        this.dispatchEvent(XElement.upgradingEvent);
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
        this.#roots = [];
        const parsed = [];
        const stringified = [];
        let node = this.#shadow.firstChild;
        while(node){
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue && whitespace.test(node.nodeValue)) {
                const remove = node;
                node = node.nextSibling;
                this.#shadow.removeChild(remove);
            } else {
                const [s, p] = tree(node);
                parsed.push(p);
                stringified.push(s);
                this.#roots.push(node);
                node = node.nextSibling;
            }
        }
        const slots = this.#shadow.querySelectorAll('slot');
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
        this.#upgraded = true;
        this.#upgrading = false;
        this.dispatchEvent(XElement.upgradedEvent);
    }
    async slottedCallback() {
        console.log('slottedCallback');
        this.dispatchEvent(XElement.slottingEvent);
        await this.slotted?.();
        this.dispatchEvent(XElement.slottedEvent);
    }
    async connectedCallback() {
        console.log('connectedCallback');
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
