// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function Dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
const navigators = new Map();
const transition = async function(options) {
    if (!options.target) throw new Error('XElement - navigation target option required');
    if (options.cache && options.instance) return options.target.replaceChildren(options.instance);
    if (options.navigating) return;
    else options.navigating = true;
    if (!options.file) throw new Error('XElement - navigation file option required');
    options.construct = options.construct ?? (await import(options.file)).default;
    if (!options.construct?.prototype) throw new Error('XElement - navigation construct not valid');
    options.name = options.name ?? Dash(options.construct.name);
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
const tick = Promise.resolve();
const updates = [];
let patching;
const frame = function() {
    while(updates.length)updates.shift()?.();
    patching = 0;
};
function Schedule(update) {
    updates.push(update);
    if (patching) return;
    patching = 1;
    tick.then(frame);
}
const NameSymbol = Symbol('name');
Symbol('value');
const TypeSymbol = Symbol('type');
const ElementSymbol = Symbol('element');
const ChildrenSymbol = Symbol('children');
const AttributesSymbol = Symbol('attributes');
const CdataSymbol = Symbol('cdata');
const CommentSymbol = Symbol('comment');
const DateAttributes = [
    'datetime-local',
    'date',
    'month',
    'time',
    'week'
];
const BooleanAttributes = [
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
];
const __default = new Proxy({}, {
    get (eTarget, eName, eReceiver) {
        if (typeof eName === 'symbol') return Reflect.get(eTarget, eName, eReceiver);
        if (eName === 'comment') {
            return function CommentProxy(...value) {
                return {
                    name: 'comment',
                    value: value.join(''),
                    [TypeSymbol]: CommentSymbol
                };
            };
        }
        if (eName === 'cdata') {
            return function CommentProxy(...value) {
                return {
                    name: 'cdata',
                    value: value.join(''),
                    [TypeSymbol]: CdataSymbol
                };
            };
        }
        return function ElementProxy(attributes, ...children) {
            if (attributes?.[TypeSymbol] === CommentSymbol || attributes?.[TypeSymbol] === ElementSymbol || attributes?.[TypeSymbol] === CdataSymbol || attributes?.constructor !== Object) {
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
                children,
                attributes,
                [TypeSymbol]: ElementSymbol,
                [NameSymbol]: Dash(eName)
            }, {
                get (aTarget, aName, aReceiver) {
                    if (typeof aName === 'symbol') return Reflect.get(aTarget, aName, aReceiver);
                    if (aName === 'children') return Reflect.get(aTarget, aName, aReceiver);
                    if (aName === 'attributes') return Reflect.get(aTarget, aName, aReceiver);
                    return function AttributeProxy(aValue) {
                        Reflect.set(aTarget.attributes, aName, aValue);
                        return aReceiver;
                    };
                }
            });
        };
    }
});
const ContextCache = new WeakMap();
const ContextNext = Promise.resolve();
const ContextSet = function(method, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
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
    if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
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
    if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
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
function Display(data) {
    switch(typeof data){
        case 'undefined':
            return '';
        case 'string':
            return data;
        case 'number':
            return `${data}`;
        case 'bigint':
            return `${data}`;
        case 'boolean':
            return `${data}`;
        case 'function':
            return `${data()}`;
        case 'symbol':
            return String(data);
        case 'object':
            return JSON.stringify(data);
        default:
            throw new Error('Display - type not handled');
    }
}
function Attribute(element, name, value) {
    if (name === 'value') {
        const type = Reflect.get(element, 'type');
        if (typeof value === 'number' && DateAttributes.includes(type)) {
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
    } else if (BooleanAttributes.includes(name)) {
        const result = value ? true : false;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else {
        const display = Display(value);
        if (element.getAttribute(name) !== display) {
            element.setAttribute(name, display);
        }
    }
}
const PatchCreateElement = function(owner, item) {
    const element = owner.createElement(item[NameSymbol]);
    for(const name in item.attributes){
        const value = item.attributes[name];
        Attribute(element, name, value);
    }
    for (const child of item.children){
        PatchAppend(element, child);
    }
    return element;
};
const PatchAppend = function(parent, child) {
    const owner = parent.ownerDocument;
    if (child?.[TypeSymbol] === ElementSymbol) {
        parent.appendChild(PatchCreateElement(owner, child));
    } else if (child?.[TypeSymbol] === CommentSymbol) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child?.[TypeSymbol] === CdataSymbol) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else {
        parent.appendChild(owner.createTextNode(Display(child)));
    }
};
const PatchRemove = function(parent) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};
const PatchCommon = function(node, target) {
    const owner = node.ownerDocument;
    const virtualType = target?.[TypeSymbol];
    const virtualName = target?.[NameSymbol];
    if (virtualType === CommentSymbol) {
        const value = Display(target);
        if (node.nodeName != '#comment') {
            node.parentNode?.replaceChild(owner?.createComment(value), node);
        } else if (node.nodeValue != value) {
            node.nodeValue = value;
        }
        return;
    }
    if (virtualType === CdataSymbol) {
        const value1 = Display(target);
        if (node.nodeName != '#cdata-section') {
            node.parentNode?.replaceChild(owner?.createCDATASection(value1), node);
        } else if (node.nodeValue != value1) {
            node.nodeValue = value1;
        }
        return;
    }
    if (virtualType !== ElementSymbol) {
        const value2 = Display(target);
        if (node.nodeName != '#text') {
            node.parentNode?.replaceChild(owner?.createTextNode(value2), node);
        } else if (node.nodeValue != value2) {
            node.nodeValue = value2;
        }
        return;
    }
    if (!(node instanceof Element)) throw new Error('Patch - node type not handled');
    if (node.localName !== virtualName) {
        node.parentNode?.replaceChild(PatchCreateElement(owner, target), node);
        return;
    }
    for(const name in target.attributes){
        const value3 = target.attributes[name];
        Attribute(node, name, value3);
    }
    if (node.hasAttributes()) {
        const names = node.getAttributeNames();
        for (const name1 of names){
            if (!(name1 in target.attributes)) {
                node.removeAttribute(name1);
            }
        }
    }
    let index;
    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const nodeChildren = node.childNodes;
    const nodeLength = nodeChildren.length;
    const commonLength = Math.min(nodeLength, targetLength);
    for(index = 0; index < commonLength; index++){
        PatchCommon(nodeChildren[index], targetChildren[index]);
    }
    if (nodeLength > targetLength) {
        for(index = targetLength; index < nodeLength; index++){
            PatchRemove(node);
        }
    } else if (nodeLength < targetLength) {
        for(index = nodeLength; index < targetLength; index++){
            PatchAppend(node, targetChildren[index]);
        }
    }
};
function Patch(root, fragment) {
    let index;
    const virtualChildren = fragment;
    const virtualLength = virtualChildren.length;
    const rootChildren = root.childNodes;
    const rootLength = rootChildren.length;
    const commonLength = Math.min(rootLength, virtualLength);
    for(index = 0; index < commonLength; index++){
        PatchCommon(rootChildren[index], virtualChildren[index]);
    }
    if (rootLength > virtualLength) {
        for(index = virtualLength; index < rootLength; index++){
            PatchRemove(root);
        }
    } else if (rootLength < virtualLength) {
        for(index = rootLength; index < virtualLength; index++){
            PatchAppend(root, virtualChildren[index]);
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
    static connectedEvent = new Event('connected');
    static connectingEvent = new Event('connecting');
    static attributedEvent = new Event('attributed');
    static attributingEvent = new Event('attributing');
    static disconnectedEvent = new Event('disconnected');
    static disconnectingEvent = new Event('disconnecting');
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }
    #root;
    #context;
    #component;
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
        const update = ()=>Patch(this.#root, this.#component());
        const change = ()=>Schedule(update);
        this.#context = ContextCreate(context(), change);
        this.#component = component.bind(this.#context, __default, this.#context);
        if (this.#root !== this) this[upgrade]();
    }
    [upgrade]() {
        Patch(this.#root, this.#component());
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
function Render(root, context, component) {
    const update = function() {
        Schedule(()=>Patch(root(), component()));
    };
    context = ContextCreate(context(), update);
    component = component.bind(null, __default, context);
    update();
}
export { navigation as Navigation };
export { navigation as navigation };
export { navigation as xnavigation };
export { navigation as XNavigation };
export { __default as Virtual };
export { __default as virtual };
export { __default as xvirtual };
export { __default as XVirtual };
export { ContextCreate as Context };
export { ContextCreate as context };
export { ContextCreate as xcontext };
export { ContextCreate as XContext };
export { Render as Render };
export { Render as render };
export { Render as xrender };
export { Render as XRender };
export { Schedule as Schedule };
export { Schedule as schedule };
export { Schedule as xschedule };
export { Schedule as XSchedule };
export { Patch as Patch };
export { Patch as patch };
export { Patch as xpatch };
export { Patch as XPatch };
export { XElement as XElement };
