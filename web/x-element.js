// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

Node.TEXT_NODE;
Node.ELEMENT_NODE;
Node.COMMENT_NODE;
Node.DOCUMENT_NODE;
Node.CDATA_SECTION_NODE;
Node.DOCUMENT_FRAGMENT_NODE;
const TypeSymbol = Symbol('type');
const ElementSymbol = Symbol('element');
const ChildrenSymbol = Symbol('children');
const AttributesSymbol = Symbol('attributes');
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
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
const __default = new Proxy({}, {
    get (_, name) {
        return (attributes, ...children)=>{
            if (attributes?.constructor !== Object || attributes?.[TypeSymbol] === ElementSymbol) {
                if (attributes !== undefined) {
                    children.unshift(attributes);
                }
                attributes = {};
            } else {
                attributes = attributes ?? {};
            }
            children[TypeSymbol] = ChildrenSymbol;
            attributes[TypeSymbol] = AttributesSymbol;
            return new Proxy({
                name,
                children,
                attributes,
                [TypeSymbol]: ElementSymbol
            }, {
                get (target, key, receiver) {
                    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
                    if (key === 'name') return Reflect.get(target, key, receiver);
                    if (key === 'children') return Reflect.get(target, key, receiver);
                    if (key === 'attributes') return Reflect.get(target, key, receiver);
                    return (value)=>{
                        Reflect.set(target.attributes, key, value);
                        return receiver;
                    };
                }
            });
        };
    }
});
const updates = [];
let patching;
let request;
const frame = function() {
    patching = 1;
    while(updates.length)updates.shift()?.();
    patching = 0;
    request = 0;
};
function Schedule(update) {
    updates.push(update);
    if (patching) return;
    cancelAnimationFrame(request);
    request = requestAnimationFrame(frame);
}
const ContextCache = new WeakMap();
const ContextNext = Promise.resolve();
const ContextSet = function(method, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function') {
        const cache = ContextCache.get(from);
        if (cache === value) return true;
        ContextCache.delete(from);
    }
    Reflect.set(target, key, value, receiver);
    ContextNext.then(method);
    return true;
};
const ContextGet = function(method, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && value.constructor.name === 'Object' || value.constructor.name === 'Array') {
        const cache = ContextCache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, method),
            set: ContextSet.bind(null, method),
            deleteProperty: ContextDelete.bind(null, method)
        });
        ContextCache.set(value, proxy);
        return proxy;
    }
    if (value && target.constructor.name === 'Object' && value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction') {
        const cache1 = ContextCache.get(value);
        if (cache1) return cache1;
        const proxy1 = new Proxy(value, {
            apply (t, _, a) {
                return Reflect.apply(t, receiver, a);
            }
        });
        ContextCache.set(value, proxy1);
        return proxy1;
    }
    return value;
};
const ContextDelete = function(method, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    const from = Reflect.get(target, key);
    ContextCache.delete(from);
    Reflect.deleteProperty(target, key);
    ContextNext.then(method);
    return true;
};
const ContextCreate = function(data, method) {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method)
    });
};
const booleansDefault = Object.freeze([
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
function Attribute(element, name, value) {
    if (name === 'value') {
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
    } else if (name.startsWith('on')) {
        if (Reflect.has(element, `x${name}`)) {
            element.addEventListener(name.slice(2), Reflect.get(element, `x${name}`));
        } else {
            Reflect.set(element, `x${name}`, value);
            element.addEventListener(name.slice(2), value);
        }
        if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (booleansDefault.includes(name)) {
        const result = value ? true : false;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else if (element.getAttribute(name) !== `${value}`) {
        element.setAttribute(name, value);
    }
}
function Create(item) {
    const element = document.createElement(item.name);
    for(const name in item.attributes){
        const value = item.attributes[name];
        Attribute(element, name, value);
    }
    for (const child of item.children){
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(Create(child));
        }
    }
    return element;
}
function Text(child) {
    return `${child}`;
}
const PatchNode = function(source, target) {
    if (target?.[TypeSymbol] !== ElementSymbol) {
        const value = Text(target);
        if (source.textContent !== value) source.textContent = value;
        return;
    }
    if (source.nodeName !== target.name.toUpperCase()) {
        source.parentNode?.replaceChild(Create(target), source);
        return;
    }
    if (!(source instanceof Element)) throw new Error('Patch - source type not handled');
    for(const name in target.attributes){
        const value1 = target.attributes[name];
        Attribute(source, name, value1);
    }
    if (source.hasAttributes()) {
        const names = source.getAttributeNames();
        for (const name1 of names){
            if (!(name1 in target.attributes)) {
                source.removeAttribute(name1);
            }
        }
    }
    const targetChildren = target.children;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const targetLength = targetChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    for(let index = 0; index < commonLength; index++){
        PatchNode(sourceChildren[index], targetChildren[index]);
    }
    if (sourceLength > targetLength) {
        let child;
        for(let index1 = targetLength; index1 < sourceLength; index1++){
            child = source.lastChild;
            if (child) source.removeChild(child);
        }
    } else if (sourceLength < targetLength) {
        let child1;
        for(let index2 = sourceLength; index2 < targetLength; index2++){
            child1 = targetChildren[index2];
            if (child1 && child1[TypeSymbol] === ElementSymbol) {
                source.appendChild(Create(child1));
            } else {
                source.appendChild(document.createTextNode(Text(child1)));
            }
        }
    }
};
function Patch(source, fragment) {
    const targetChildren = fragment;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const targetLength = targetChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    for(let index = 0; index < commonLength; index++){
        PatchNode(sourceChildren[index], targetChildren[index]);
    }
    if (sourceLength > targetLength) {
        let child;
        for(let index1 = targetLength; index1 < sourceLength; index1++){
            child = source.lastChild;
            if (child) source.removeChild(child);
        }
    } else if (sourceLength < targetLength) {
        let child1;
        for(let index2 = sourceLength; index2 < targetLength; index2++){
            child1 = targetChildren[index2];
            if (child1 && child1[TypeSymbol] === ElementSymbol) {
                source.appendChild(Create(child1));
            } else {
                source.appendChild(document.createTextNode(Text(child1)));
            }
        }
    }
}
const upgrade = Symbol('upgrade');
const DEFINED = new WeakSet();
const CE = window.customElements;
Object.defineProperty(window, 'customElements', {
    get: ()=>({
            define (name, constructor, options) {
                if (constructor.prototype instanceof XElement && !DEFINED.has(constructor)) {
                    constructor = new Proxy(constructor, {
                        construct (target, args, extender) {
                            const instance = Reflect.construct(target, args, extender);
                            instance[upgrade]();
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
    #root;
    #context;
    #component;
    #updating = false;
    #shadow;
    constructor(){
        super();
        this.#shadow = this.shadowRoot ?? this.attachShadow({
            mode: 'open'
        });
        this.#shadow.addEventListener('slotchange', this.slottedCallback.bind(this));
        const options = Reflect.get(this.constructor, 'options') ?? {};
        const context = Reflect.get(this.constructor, 'context');
        const component = Reflect.get(this.constructor, 'component');
        if (options.root === 'this') this.#root = this;
        else if (options.root === 'shadow') this.#root = this.shadowRoot;
        else this.#root = this.shadowRoot;
        if (options.slot === 'default') this.#shadow.appendChild(document.createElement('slot'));
        this.#context = ContextCreate(context(), this.#update.bind(this));
        this.#component = component.bind(this.#context, __default, this.#context);
        if (this.#root !== this) this[upgrade]();
    }
    [upgrade]() {
        this.dispatchEvent(XElement.upgradingEvent);
        Patch(this.#root, this.#component());
        this.dispatchEvent(XElement.upgradedEvent);
    }
    #update() {
        this.dispatchEvent(XElement.updatingEvent);
        if (this.#updating) return;
        this.#updating = true;
        Schedule(()=>Patch(this.#root, this.#component()));
        this.#updating = false;
        this.dispatchEvent(XElement.updatedEvent);
    }
    async slottedCallback() {
        this.dispatchEvent(XElement.slottingEvent);
        await Reflect.get(this, 'slotted')?.();
        this.dispatchEvent(XElement.slottedEvent);
    }
    async connectedCallback() {
        this.dispatchEvent(XElement.connectingEvent);
        await Reflect.get(this, 'connected')?.();
        this.dispatchEvent(XElement.connectedEvent);
    }
    async disconnectedCallback() {
        this.dispatchEvent(XElement.disconnectingEvent);
        await Reflect.get(this, 'disconnected')?.();
        this.dispatchEvent(XElement.disconnectedEvent);
    }
    async adoptedCallback() {
        this.dispatchEvent(XElement.adoptingEvent);
        await Reflect.get(this, 'adopted')?.();
        this.dispatchEvent(XElement.adoptedEvent);
    }
    async attributeChangedCallback(name, from, to) {
        this.dispatchEvent(XElement.attributingEvent);
        await Reflect.get(this, 'attributed')?.(name, from, to);
        this.dispatchEvent(XElement.attributedEvent);
    }
}
export { XElement as default };
