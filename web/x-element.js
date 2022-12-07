// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

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
function Dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
const $ = Symbol('$');
const NameSymbol = Symbol('name');
Symbol('value');
Symbol('self');
const CdataSymbol = Symbol('cdata');
const CommentSymbol = Symbol('comment');
const TypeSymbol = Symbol('type');
const ElementSymbol = Symbol('element');
const ChildrenSymbol = Symbol('children');
const AttributesSymbol = Symbol('attributes');
const ParametersSymbol = Symbol('parameters');
const RenderCache = new WeakMap();
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
                    name: eName,
                    value: value.join(''),
                    [TypeSymbol]: CommentSymbol
                };
            };
        }
        if (eName === 'cdata') {
            return function CdataProxy(...value) {
                return {
                    name: eName,
                    value: value.join(''),
                    [TypeSymbol]: CdataSymbol
                };
            };
        }
        return function ElementProxy(...children) {
            return new Proxy({
                [AttributesSymbol]: {},
                [ParametersSymbol]: {},
                [ChildrenSymbol]: children,
                [TypeSymbol]: ElementSymbol,
                [NameSymbol]: Dash(eName).toUpperCase()
            }, {
                get (aTarget, aName, aReceiver) {
                    if (typeof aName === 'symbol') return Reflect.get(aTarget, aName, aReceiver);
                    return function AttributeProxy(aValue, ...aParameters) {
                        Reflect.set(aTarget[AttributesSymbol], aName, aValue);
                        Reflect.set(aTarget[ParametersSymbol], aName, aParameters);
                        return aReceiver;
                    };
                }
            });
        };
    }
});
const caches = new WeakMap();
Promise.resolve();
async function Schedule(target, update) {
    let cache = caches.get(target);
    if (!cache) {
        cache = {};
        caches.set(target, cache);
    }
    if (cache.current) {
        clearTimeout(cache.timer);
        cache.update = update;
    } else {
        cache.update = update;
    }
    cache.current = new Promise((resolve)=>{
        cache.resolves.push(resolve);
        cache.timer = setTimeout(async ()=>{
            await cache.update();
            cache.current = undefined;
            cache.update = undefined;
            cache.timer = undefined;
            const resolves = cache.resolves;
            cache.resolves = [];
            console.log(resolves);
            resolves.forEach((r)=>r());
        }, 100);
    });
    await cache.current;
}
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
function Attribute(element, name, value, parameters) {
    if (name === 'value') {
        value = `${value == undefined ? '' : value}`;
        if (element.getAttribute(name) === value) return;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    } else if (name.startsWith('on')) {
        const original = Reflect.get(element, `xRaw${name}`);
        if (original === value) return;
        const wrapped = Reflect.get(element, `xWrap${name}`);
        const wrap = function(e) {
            if (parameters[0]?.prevent) e.preventDefault();
            if (parameters[0]?.stop) e.stopPropagation();
            return value(e);
        };
        Reflect.set(element, `xRaw${name}`, value);
        Reflect.set(element, `xWrap${name}`, wrap);
        element.addEventListener(name.slice(2), wrap, parameters?.[0]);
        element.removeEventListener(name.slice(2), wrapped);
        if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (BooleanAttributes.includes(name)) {
        const result = value ? true : false;
        Reflect.set(element, name, result);
        if (result) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else if (name === 'html') {
        const original1 = Reflect.get(element, 'xHtml');
        if (original1 === value) return;
        Reflect.set(element, 'xHtml', value);
        Reflect.set(element, 'innerHTML', value);
    } else {
        const display = Display(value);
        if (element.getAttribute(name) !== display) {
            element.setAttribute(name, display);
        }
    }
}
const PatchAttributes = function(element, item) {
    const parameters = item[ParametersSymbol];
    const attributes = item[AttributesSymbol];
    if (attributes['type']) {
        const value = attributes['type'];
        Attribute(element, 'type', value, parameters['type']);
    }
    for(const name in attributes){
        if (name === 'type') continue;
        const value1 = attributes[name];
        Attribute(element, name, value1, parameters[name]);
    }
    if (element.hasAttributes()) {
        const names = element.getAttributeNames();
        for (const name1 of names){
            if (!(name1 in attributes)) {
                element.removeAttribute(name1);
            }
        }
    }
};
const PatchCreateElement = function(owner, item) {
    const element = owner.createElement(item[NameSymbol]);
    const parameters = item[ParametersSymbol];
    const attributes = item[AttributesSymbol];
    const children = item[ChildrenSymbol];
    if (attributes['html']) {
        PatchAttributes(element, item);
        return element;
    }
    for (const child of children){
        PatchAppend(element, child);
    }
    for(const name in attributes){
        const value = attributes[name];
        Attribute(element, name, value, parameters[name]);
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
    const virtualAttributes = target?.[AttributesSymbol];
    if (virtualType === CommentSymbol) {
        const value = Display(target);
        if (node.nodeName !== '#comment') {
            node.parentNode?.replaceChild(owner?.createComment(value), node);
        } else if (node.nodeValue !== value) {
            node.nodeValue = value;
        }
        return;
    }
    if (virtualType === CdataSymbol) {
        const value1 = Display(target);
        if (node.nodeName !== '#cdata-section') {
            node.parentNode?.replaceChild(owner?.createCDATASection(value1), node);
        } else if (node.nodeValue !== value1) {
            node.nodeValue = value1;
        }
        return;
    }
    if (virtualType !== ElementSymbol) {
        const value2 = Display(target);
        if (node.nodeName !== '#text') {
            node.parentNode?.replaceChild(owner?.createTextNode(value2), node);
        } else if (node.nodeValue !== value2) {
            node.nodeValue = value2;
        }
        return;
    }
    if (node.nodeName !== virtualName) {
        node.parentNode?.replaceChild(PatchCreateElement(owner, target), node);
        return;
    }
    if (!(node instanceof Element)) {
        throw new Error('Patch - node type not handled');
    }
    if (virtualAttributes['html']) {
        PatchAttributes(node, target);
        return;
    }
    const targetChildren = target[ChildrenSymbol];
    const targetLength = targetChildren.length;
    const nodeChildren = [
        ...node.childNodes
    ];
    const nodeLength = nodeChildren.length;
    const commonLength = Math.min(nodeLength, targetLength);
    let index;
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
    PatchAttributes(node, target);
};
function Patch(root, fragment) {
    let index;
    const virtualChildren = fragment;
    const virtualLength = virtualChildren.length;
    const rootChildren = [
        ...root.childNodes
    ];
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
class Component extends HTMLElement {
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }
    [$] = {};
    #root;
    #shadow;
    constructor(){
        super();
        this.#shadow = this.shadowRoot ?? this.attachShadow({
            mode: 'open'
        });
        const options = Reflect.get(this.constructor, 'options') ?? {};
        const context = Reflect.get(this.constructor, 'context');
        const component = Reflect.get(this.constructor, 'component');
        if (options.root === 'this') this.#root = this;
        else if (options.root === 'shadow') this.#root = this.shadowRoot;
        else this.#root = this.shadowRoot;
        if (options.slot === 'default') this.#shadow.appendChild(document.createElement('slot'));
        this[$].update = async ()=>{
            if (this[$].context.upgrade) await this[$].context.upgrade()?.catch?.(console.error);
            Patch(this.#root, this[$].component());
            if (this[$].context.upgraded) await this[$].context.upgraded()?.catch(console.error);
        };
        this[$].change = async ()=>{
            await Schedule(this.#root, this[$].update);
        };
        this[$].context = ContextCreate(context(__default), this[$].change);
        this[$].component = component.bind(this[$].context, __default, this[$].context);
        this[$].render = async ()=>{
            if (this.parentNode) {
                const cache = RenderCache.get(this.parentNode);
                if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
                if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
                RenderCache.set(this.parentNode, this[$].context);
            }
            if (this[$].context.connect) await this[$].context.connect()?.catch?.(console.error);
            await Schedule(this.#root, this[$].update);
            if (this[$].context.connected) await this[$].context.connected()?.catch(console.error);
        };
    }
}
async function Render(target, context, component) {
    const instance = {};
    instance.update = async function() {
        if (instance.context.upgrade) await instance.context.upgrade()?.catch?.(console.error);
        Patch(target, instance.component());
        if (instance.context.upgraded) await instance.context.upgraded()?.catch(console.error);
    };
    instance.change = async function() {
        await Schedule(target, instance.update);
    };
    instance.context = ContextCreate(context(__default), instance.change);
    instance.component = component.bind(instance.context, __default, instance.context);
    instance.render = async function() {
        const cache = RenderCache.get(target);
        if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
        if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
        RenderCache.set(target, instance.context);
        if (instance.context.connect) await instance.context.connect()?.catch?.(console.error);
        await Schedule(target, instance.update);
        if (instance.context.connected) await instance.context.connected()?.catch(console.error);
    };
    await instance.render();
    return instance;
}
const alls = [];
const routes = [];
const transition = async function(route) {
    if (route.cache && route.instance) {
        if (route.instance instanceof Component || route.instance.prototype instanceof Component) {
            route.target.replaceChildren(route.instance);
            await route.instance[$].render();
        } else {
            await route.instance.render();
        }
    } else {
        if (route.component instanceof Component || route.component.prototype instanceof Component) {
            route.name = route.name ?? Dash(route.component.name);
            if (!/^\w+-\w+/.test(route.name)) route.name = `x-${route.name}`;
            if (!customElements.get(route.name)) customElements.define(route.name, route.component);
            await customElements.whenDefined(route.name);
            route.instance = document.createElement(route.name);
            route.target.replaceChildren(route.instance);
            route.instance[$].render();
        } else {
            route.instance = await Render(route.target, route.context, route.component);
        }
    }
};
const navigate = function(event) {
    if (event && 'canIntercept' in event && event.canIntercept === false) return;
    if (event && 'canTransition' in event && event.canTransition === false) return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const transitions = [];
    for (const route of routes){
        if (route.path !== pathname) continue;
        if (!route.target) continue;
        Reflect.set(route.target, 'xRouterPath', route.path);
        transitions.push(route);
    }
    for (const all of alls){
        if (!all.target) continue;
        let has = false;
        for (const transition1 of transitions){
            if (transition1.target === all.target) {
                has = true;
                break;
            }
        }
        if (has) continue;
        if (Reflect.get(all.target, 'xRouterPath') === pathname) continue;
        transitions.push(all);
    }
    if (event?.intercept) {
        return event.intercept({
            handler: ()=>transitions.map((route)=>transition(route))
        });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(transitions.map((route)=>transition(route)));
    } else {
        transitions.map((route)=>transition(route));
    }
};
function router(path, target, component, context, cache) {
    if (!path) throw new Error('XElement - router path required');
    if (!target) throw new Error('XElement - router target required');
    if (!component) throw new Error('XElement - router component required');
    if (!(component instanceof Component || component.prototype instanceof Component) && !context) throw new Error('XElement - router context required');
    if (path === '/*') {
        for (const all of alls){
            if (all.path === path && all.target === target) {
                throw new Error('XElement - router duplicate path and target');
            }
        }
        alls.push({
            path,
            target,
            context,
            component,
            cache: cache ?? true
        });
    } else {
        for (const route of routes){
            if (route.path === path && route.target === target) {
                throw new Error('XElement - router duplicate path and target');
            }
        }
        routes.push({
            path,
            target,
            context,
            component,
            cache: cache ?? true
        });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
export { __default as Virtual };
export { __default as virtual };
export { ContextCreate as Context };
export { ContextCreate as context };
export { router as Router };
export { router as router };
export { Render as Render };
export { Render as render };
export { Schedule as Schedule };
export { Schedule as schedule };
export { Patch as Patch };
export { Patch as patch };
export { Component as Component };
export { Component as component };
const __default1 = {
    Component,
    Schedule,
    Virtual: __default,
    Context: ContextCreate,
    Router: router,
    Render,
    Patch,
    component: Component,
    schedule: Schedule,
    virtual: __default,
    context: ContextCreate,
    router: router,
    render: Render,
    patch: Patch
};
export { __default1 as default };
