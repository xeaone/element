// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();
async function Schedule(target, update) {
    let cache = ScheduleCache.get(target);
    if (!cache) {
        cache = {
            resolves: []
        };
        ScheduleCache.set(target, cache);
    }
    if (cache.current) {
        clearTimeout(cache.timer);
        cache.update = update;
    } else {
        cache.update = update;
    }
    cache.current = new Promise((resolve)=>{
        cache.resolves.push(resolve);
        cache.timer = setTimeout(function ScheduleTime() {
            let r;
            const rs = cache.resolves;
            const u = cache.update;
            cache.current = undefined;
            cache.update = undefined;
            cache.timer = undefined;
            cache.resolves = [];
            ScheduleNext.then(u).then(function ScheduleResolves() {
                for (r of rs)r();
            });
        }, 100);
    });
    await cache.current;
}
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
function Define(name, constructor) {
    customElements.define(name, constructor);
}
Symbol('$');
Symbol('name');
Symbol('value');
Symbol('self');
Symbol('cdata');
Symbol('comment');
Symbol('type');
Symbol('element');
Symbol('children');
Symbol('attributes');
Symbol('parameters');
new WeakMap();
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
const OnCache = new WeakMap();
const attributes = function(source, target, bindings) {
    const targetAttributeNames = target.hasAttributes() ? [
        ...target.getAttributeNames()
    ] : [];
    const sourceAttributeNames = source.hasAttributes() ? [
        ...source.getAttributeNames()
    ] : [];
    for (const name of targetAttributeNames){
        if (name === 'data-x-value') {
            const { value  } = bindings[target.getAttribute(name)];
            const result = `${value == undefined ? '' : value}`;
            if (source.getAttribute('value') === result) continue;
            Reflect.set(source, 'value', result);
            source.setAttribute('value', result);
        } else if (name.startsWith('data-x-on')) {
            const { value: value1  } = bindings[target.getAttribute(name)];
            if (OnCache.get(source) === value1) continue;
            source.addEventListener(name.slice(9), value1);
        } else if (BooleanAttributes.includes(name.slice(7))) {
            const { value: value2  } = bindings[target.getAttribute(name)];
            const slice = name.slice(7);
            const result1 = value2 ? true : false;
            const has = source.hasAttribute(slice);
            if (has === result1) continue;
            Reflect.set(source, name, result1);
            if (result1) source.setAttribute(slice, '');
            else source.removeAttribute(slice);
        } else if (name.startsWith('data-x')) {
            const { value: value3  } = bindings[target.getAttribute(name)];
            const slice1 = name.slice(7);
            const result2 = Display(value3);
            console.log(result2, value3, source);
            if (source.getAttribute(slice1) === result2) continue;
            source.setAttribute(slice1, result2);
        } else {
            const sourceAttributeValue = source.getAttribute(name);
            const targetAttributeValue = target.getAttribute(name);
            if (sourceAttributeValue !== targetAttributeValue) {
                source.setAttribute(name, targetAttributeValue);
                Reflect.set(source, name, targetAttributeValue);
            }
        }
    }
    for (const name1 of sourceAttributeNames){
        if (targetAttributeNames.includes(`data-x-${name1}`)) continue;
        if (!targetAttributeNames.includes(name1)) source.removeAttribute(name1);
    }
};
const children = function(node, bindings) {
    if (node instanceof Element) {
        const nodeAttributeNames = node.hasAttributes() ? [
            ...node.getAttributeNames()
        ] : [];
        for (const name of nodeAttributeNames){
            if (name === 'data-x-value') {
                const { value  } = bindings[node.getAttribute(name)];
                const result = `${value == undefined ? '' : value}`;
                Reflect.set(node, 'value', result);
                node.setAttribute('value', result);
                node.removeAttribute(name);
            } else if (name.startsWith('data-x-on')) {
                const { value: value1  } = bindings[node.getAttribute(name)];
                OnCache.set(node, value1);
                node.addEventListener(name.slice(9), value1);
                node.removeAttribute(name);
            } else if (BooleanAttributes.includes(name.slice(7))) {
                const { value: value2  } = bindings[node.getAttribute(name)];
                const slice = name.slice(7);
                const result1 = value2 ? true : false;
                Reflect.set(node, name, result1);
                if (result1) node.setAttribute(slice, '');
                else node.removeAttribute(slice);
                node.removeAttribute(name);
            } else if (name.startsWith('data-x')) {
                const { value: value3  } = bindings[node.getAttribute(name)];
                const slice1 = name.slice(7);
                const result2 = Display(value3);
                node.setAttribute(slice1, result2);
                node.removeAttribute(name);
            }
        }
    }
    let child = node.firstChild;
    while(child){
        children(child, bindings);
        child = child.nextSibling;
    }
};
const append = function(parent, child, bindings) {
    children(child, bindings);
    parent.appendChild(child);
};
const remove = function(parent) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};
const common = function(source, target, bindings) {
    if (!source.parentNode) throw new Error('source parent node not found');
    if (source.nodeName !== target.nodeName) {
        source.parentNode?.replaceChild(target, source);
        return;
    }
    if (target.nodeName === '#text') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }
        return;
    }
    if (target.nodeName === '#comment') {
        if (source.nodeValue !== target.nodeValue) {
            source.nodeValue = target.nodeValue;
        }
        return;
    }
    if (!(source instanceof Element)) throw new Error('source node not valid');
    if (!(target instanceof Element)) throw new Error('target node not valid');
    const targetChildren = [
        ...target.childNodes
    ];
    const targetLength = targetChildren.length;
    const sourceChildren = [
        ...source.childNodes
    ];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    let index;
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index], bindings);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index], bindings);
        }
    }
    attributes(source, target, bindings);
};
function patch(source, target, bindings) {
    let index;
    const targetChildren = [
        ...target.childNodes
    ];
    const targetLength = targetChildren.length;
    const sourceChildren = [
        ...source.childNodes
    ];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index], bindings);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index], bindings);
        }
    }
}
const HtmlNameSymbol = Symbol('HtmlName');
const HtmlValueSymbol = Symbol('HtmlValue');
function html(strings, ...values) {
    let data = '';
    const bindings = {};
    for(let index = 0; index < strings.length; index++){
        const part = strings[index];
        const value = values[index];
        const name = part.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';
        if (name) {
            const end = name.length + 1;
            const id = crypto.randomUUID();
            data += `${part.slice(0, -end)}data-x-${name}="${id}"`;
            bindings[id] = {
                name,
                value,
                id
            };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += value.data;
            Object.assign(bindings, value.bindings);
        } else if (value?.constructor === Array) {
            data += part;
            for (const item of value){
                if (item[HtmlNameSymbol] === HtmlValueSymbol) {
                    data += item.data;
                    Object.assign(bindings, item.bindings);
                } else {
                    data += `${Display(value)}`;
                }
            }
        } else {
            data += `${part}${Display(value)}`;
        }
    }
    return {
        [HtmlNameSymbol]: HtmlValueSymbol,
        data,
        bindings
    };
}
function render(root, context, component) {
    const componentInstance = component(html, context);
    const { data , bindings  } = componentInstance;
    const template = document.createElement('template');
    template.innerHTML = data;
    patch(root, template.content, bindings);
}
function mount(root, context, component) {
    const update = function() {
        console.log('update');
        renderInstance();
    };
    const contextInstance = ContextCreate(context(html), update);
    const renderInstance = render.bind(null, root, contextInstance, component);
    update();
    return update;
}
const alls = [];
const routes = [];
const transition = function(route) {
    console.log(route);
    if (route.render) {
        route.render();
    } else {
        route.render = mount(route.root, route.context, route.component);
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
        if (!route.root) continue;
        Reflect.set(route.root, 'xRouterPath', route.path);
        transitions.push(route);
    }
    for (const all of alls){
        if (!all.root) continue;
        let has = false;
        for (const transition1 of transitions){
            if (transition1.root === all.root) {
                has = true;
                break;
            }
        }
        if (has) continue;
        if (Reflect.get(all.root, 'xRouterPath') === pathname) continue;
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
function router(path, root, context, component) {
    if (!path) throw new Error('XElement - router path required');
    if (!root) throw new Error('XElement - router root required');
    if (!context) throw new Error('XElement - router context required');
    if (!component) throw new Error('XElement - router component required');
    if (path === '/*') {
        for (const all of alls){
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        alls.push({
            path,
            root,
            context,
            component
        });
    } else {
        for (const route of routes){
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        routes.push({
            path,
            root,
            context,
            component
        });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
}
export { Schedule as Schedule };
export { Schedule as schedule };
export { ContextCreate as Context };
export { ContextCreate as context };
export { Define as Define };
export { Define as define };
export { router as Router };
export { router as router };
export { render as Render };
export { render as render };
export { patch as Patch };
export { patch as patch };
export { mount as Mount };
export { mount as mount };
const Index = {
    Schedule,
    Context: ContextCreate,
    Define,
    Router: router,
    Render: render,
    Patch: patch,
    Mount: mount,
    schedule: Schedule,
    context: ContextCreate,
    define: Define,
    router: router,
    render: render,
    patch: patch,
    mount: mount
};
export { Index as default };
