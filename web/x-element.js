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
const TextType = 3;
const ElementType = 1;
const AttributeType = 2;
const TEXT = 'Text';
const IN_OPEN = 'InOpen';
const IN_CLOSE = 'InClose';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';
const special = [
    'script',
    'style'
];
const empty = [
    'area',
    'base',
    'basefont',
    'br',
    'col',
    'frame',
    'hr',
    'img',
    'input',
    'isindex',
    'link',
    'meta',
    'param',
    'embed'
];
function virtual(data) {
    const fragment = {
        id: 1,
        type: 11,
        children: [],
        name: 'fragment'
    };
    let id = 1;
    let mode = ELEMENT_CHILDREN;
    let node = fragment;
    for(let i = 0; i < data.length; i++){
        const c = data[i];
        const next = data[i + 1];
        if (mode === ELEMENT_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
            } else {
                node.name += c;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
                node = node.parent;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node = node.parent;
                node.closed = true;
            } else if (c === '>') {
                mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
            } else if (c === '=') {
                i++;
                mode = ATTRIBUTE_VALUE;
            } else {
                node.name += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            if (c === '"') {
                mode = IN_OPEN;
                node = node.parent;
            } else {
                node.value += c;
            }
        } else if (mode === IN_OPEN) {
            if (c === ' ') {
                continue;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                if (empty.includes(node.name)) node.closed = true;
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
            } else {
                node = {
                    id: id += 1,
                    name: c === ' ' ? '' : c,
                    value: '',
                    parent: node,
                    type: AttributeType
                };
                node.parent.attributes.push(node);
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === IN_CLOSE) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
            } else {
                continue;
            }
        } else if (mode === TEXT) {
            if (c === '<' && next === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
                node = node.parent;
            } else if (c === '<') {
                node = node.parent;
                node = {
                    id: id += 1,
                    name: '',
                    parent: node,
                    children: [],
                    attributes: [],
                    type: ElementType
                };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else {
                node.value += c;
            }
        } else if (mode === ELEMENT_CHILDREN) {
            if (c === '<' && next === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
            } else if (c === '<') {
                node = {
                    id: id += 1,
                    name: '',
                    parent: node,
                    children: [],
                    attributes: [],
                    type: ElementType
                };
                node.parent.children.push(node);
                mode = ELEMENT_NAME;
            } else {
                node = {
                    id: id += 1,
                    value: c,
                    parent: node,
                    name: '#text',
                    type: TextType
                };
                node.parent.children.push(node);
                mode = TEXT;
            }
        }
    }
    return fragment;
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
const attribute = function(element, name, value, properties) {
    console.log(arguments);
    if (name.startsWith('data-x-')) {
        const property = properties[name.slice(7)];
        if (property.name === 'value') {
            element.setAttribute(property.name, property.value);
            Reflect.set(element, property.name, property.value);
        } else if (property.name.startsWith('on')) {
            console.log(property);
            element.removeAttribute(property.name);
            element.addEventListener(property.name, property.value);
        } else if (BooleanAttributes.includes(property.name)) {
            const result = property.value ? true : false;
            const has = element.hasAttribute(property.name);
            if (has === result) return;
            if (result) element.setAttribute(property.name, '');
            else element.removeAttribute(property.name);
            Reflect.set(element, property.name, result);
        }
        if (element.getAttribute(property.name) === property.value) return;
        element.setAttribute(property.name, property.value);
        Reflect.set(element, property.name, property.value);
    } else {
        if (element.getAttribute(name) === value) return;
        element.setAttribute(name, value);
        Reflect.set(element, name, value);
    }
};
const attributes = function(source, target, properties) {
    const attributes = target.attributes;
    for(const name in attributes){
        const value = attributes[name];
        attribute(source, name, value, properties);
    }
    if (source.hasAttributes()) {
        const names = source.getAttributeNames();
        for (const name1 of names){
            if (!(name1 in attributes)) {
                source.removeAttribute(name1);
            }
        }
    }
};
const create = function(owner, node, properties) {
    const element = owner.createElement(node.name);
    const children = node.children;
    for (const child of children){
        append(element, child, properties);
    }
    const attributes = node.attributes;
    for(const name in attributes){
        const value = attributes[name];
        attribute(element, name, value, properties);
    }
    return element;
};
const append = function(parent, child, properties) {
    const owner = parent.ownerDocument;
    if (child.type === Node.ELEMENT_NODE) {
        console.log(parent, child);
        parent.appendChild(create(owner, child, properties));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else {
        parent.appendChild(owner.createTextNode(Display(child.value)));
    }
};
const remove = function(parent) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};
const common = function(source, target, properties) {
    console.log(source, target);
    if (!source.parentNode) throw new Error('source parent node not found');
    const owner = source.ownerDocument;
    if (source.nodeName !== target.name) {
        source.parentNode?.replaceChild(create(owner, target, properties), source);
        return;
    }
    if (target.name === '#text') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }
        return;
    }
    if (target.nodeName === '#comment') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }
        return;
    }
    if (!(source instanceof Element)) throw new Error('source node not valid');
    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const sourceChildren = [
        ...source.childNodes
    ];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    let index;
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index], properties);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index], properties);
        }
    }
    attributes(source, target, properties);
};
function patch(source, target, properties) {
    let index;
    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const sourceChildren = [
        ...source.childNodes
    ];
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index], properties);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index], properties);
        }
    }
}
const HtmlNameSymbol = Symbol('HtmlName');
const HtmlValueSymbol = Symbol('HtmlValue');
function html(strings, ...values) {
    let data = '';
    const properties = {};
    for(let index = 0; index < strings.length; index++){
        const part = strings[index];
        const value = values[index];
        const name = part.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';
        if (name) {
            const id = crypto.randomUUID();
            const end = name.length + 1;
            data += `${part.slice(0, -end)} data-x-${id} ${name}="${Display(value)}"`;
            properties[id] = {
                name,
                value
            };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += value.data;
            Object.assign(properties, value.properties);
        } else if (value?.constructor === Array) {
            data += part;
            for (const item of value){
                if (item[HtmlNameSymbol] === HtmlValueSymbol) {
                    data += item.data;
                    Object.assign(properties, item.properties);
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
        properties
    };
}
function render(root, context, component) {
    const componentInstance = component(html, context);
    const { data , properties  } = componentInstance;
    console.log(virtual(data));
    patch(root, virtual(data), properties);
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
