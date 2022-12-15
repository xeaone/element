// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ScheduleCache = new WeakMap();
const ScheduleNext = Promise.resolve();
async function schedule(target, task) {
    let cache = ScheduleCache.get(target);
    if (!cache) {
        cache = {
            resolves: []
        };
        ScheduleCache.set(target, cache);
    }
    if (cache.current) {
        clearTimeout(cache.timer);
        cache.task = task;
    } else {
        cache.task = task;
    }
    cache.current = new Promise((resolve)=>{
        cache.resolves.push(resolve);
        cache.timer = setTimeout(function ScheduleTime() {
            let r;
            const rs = cache.resolves;
            const u = cache.task;
            cache.current = undefined;
            cache.task = undefined;
            cache.timer = undefined;
            cache.resolves = [];
            ScheduleNext.then(u).then(function ScheduleResolves() {
                for (r of rs)r();
            });
        }, 50);
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
function define(name, constructor) {
    customElements.define(name, constructor);
}
const TextType = Node.TEXT_NODE;
const ElementType = Node.ELEMENT_NODE;
const CommentType = Node.COMMENT_NODE;
const AttributeType = Node.ATTRIBUTE_NODE;
const TEXT = 'Text';
const COMMENT = 'Comment';
const IN_OPEN = 'InOpen';
const IN_CLOSE = 'InClose';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';
const special = [
    'SCRIPT',
    'STYLE'
];
const empty = [
    'AREA',
    'BASE',
    'BASEFONT',
    'BR',
    'COL',
    'FRAME',
    'HR',
    'IMG',
    'INPUT',
    'ISINDEX',
    'LINK',
    'META',
    'PARAM',
    'EMBED'
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
        if (mode === ELEMENT_NAME) {
            if (c === ' ') {
                mode = IN_OPEN;
            } else if (c === '/') {
                i++;
                mode = ELEMENT_CHILDREN;
                node.closed = true;
                node = node.parent;
            } else if (c === '>') {
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) {
                    node.closed = true;
                    node = node.parent;
                }
            } else {
                node.name += c.toUpperCase();
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
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
                node = node.parent;
                if (empty.includes(node.name)) node.closed = true;
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
                if (special.includes(node.name)) mode = ELEMENT_CHILDREN;
                else mode = ELEMENT_CHILDREN;
                if (empty.includes(node.name)) {
                    node.closed = true;
                    node = node.parent;
                }
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
            const next = data[i + 1];
            if (c === '<' && next === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
                node = node.parent;
            } else if (c === '<' && next === '!') {
                node = node.parent;
                i++;
                mode = COMMENT;
                node = {
                    id: id += 1,
                    value: '',
                    parent: node,
                    name: '#comment',
                    type: CommentType
                };
                node.parent.children.push(node);
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
            const next1 = data[i + 1];
            if (c === '<' && next1 === '/') {
                i++;
                mode = IN_CLOSE;
                node = node.parent;
            } else if (c === '<' && next1 === '!') {
                i++;
                mode = COMMENT;
                node = {
                    id: id += 1,
                    value: '',
                    parent: node,
                    name: '#comment',
                    type: CommentType
                };
                node.parent.children.push(node);
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
        } else if (mode === COMMENT) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
                if (node.value.startsWith('--')) node.value = node.value.slice(2);
                if (node.value.endsWith('--')) node.value = node.value.slice(0, -2);
                node = node.parent;
            } else {
                node.value += c;
            }
        }
    }
    return fragment;
}
const booleans = [
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
    'onresize',
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
const escapes = new Map([
    [
        '<',
        '&lt;'
    ],
    [
        '>',
        '&gt;'
    ],
    [
        '"',
        '&quot;'
    ],
    [
        '\'',
        '&apos;'
    ],
    [
        '&',
        '&amp;'
    ],
    [
        '\r',
        '&#10;'
    ],
    [
        '\n',
        '&#13;'
    ]
]);
const escape = function(data) {
    return data?.replace(/[<>"'\r\n&]/g, (c)=>escapes.get(c) ?? c) ?? '';
};
function display(data) {
    switch(typeof data){
        case 'undefined':
            return '';
        case 'string':
            return escape(data);
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
            throw new Error('display - type not handled');
    }
}
const OnCache = new WeakMap();
const attribute = function(element, name, value, properties) {
    if (value.startsWith('{{') && value.endsWith('}}')) {
        const property = properties[value.slice(2, -2)];
        if (property.name === 'value') {
            const result = display(property.value);
            if (element.getAttribute(property.name) === result) return;
            Reflect.set(element, property.name, result);
            element.setAttribute(property.name, result);
        } else if (property.name.startsWith('on')) {
            if (OnCache.get(element) === property.value) return;
            Reflect.set(element, property.name, property.value);
            element.addEventListener(property.name, property.value);
        } else if (booleans.includes(property.name)) {
            const result1 = property.value ? true : false;
            const has = element.hasAttribute(property.name);
            if (has === result1) return;
            Reflect.set(element, property.name, result1);
            if (result1) element.setAttribute(property.name, '');
            else element.removeAttribute(property.name);
        } else {
            const result2 = display(property.value);
            if (element.getAttribute(property.name) === result2) return;
            Reflect.set(element, property.name, result2);
            element.setAttribute(property.name, result2);
        }
    } else {
        if (element.getAttribute(name) === value) return;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    }
};
const create = function(owner, node, properties) {
    const element = owner.createElement(node.name);
    const children = node.children;
    for (const child of children){
        append(element, child, properties);
    }
    const attributes = node.attributes;
    for (const { name , value  } of attributes){
        attribute(element, name, value, properties);
    }
    return element;
};
const append = function(parent, child, properties) {
    const owner = parent.ownerDocument;
    if (child.type === Node.ELEMENT_NODE) {
        parent.appendChild(create(owner, child, properties));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else if (child.type === Node.TEXT_NODE) {
        parent.appendChild(owner.createTextNode(child.value));
    } else {
        throw new Error('child type not handled');
    }
};
const remove = function(parent) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};
const common = function(source, target, properties) {
    if (!source.parentNode) throw new Error('source parent node not found');
    if (target.name === '#text') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }
        return;
    }
    if (target.name === '#comment') {
        if (source.nodeValue !== target.value) {
            source.nodeValue = target.value;
        }
        return;
    }
    if (source.nodeName !== target.name) {
        const owner = source.ownerDocument;
        source.parentNode?.replaceChild(create(owner, target, properties), source);
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
    const attributes = target.attributes;
    for (const { name , value  } of attributes){
        attribute(source, name, value, properties);
    }
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
        const string = strings[index];
        const value = values[index];
        const name = string.match(/\b([a-zA-Z-]+)=$/)?.[1] ?? '';
        if (name) {
            const id = crypto.randomUUID();
            const end = name.length + 1;
            data += `${string.slice(0, -end)}${name}="{{${id}}}"`;
            properties[id] = {
                name,
                value
            };
        } else if (value?.constructor === Object && value[HtmlNameSymbol] === HtmlValueSymbol) {
            data += string;
            data += value.data;
            Object.assign(properties, value.properties);
        } else if (value?.constructor === Array) {
            data += string;
            let map = '';
            for (const item of value){
                if (item[HtmlNameSymbol] === HtmlValueSymbol) {
                    map += item.data;
                    Object.assign(properties, item.properties);
                } else {
                    map += display(value);
                }
            }
            data += map;
        } else {
            data += string;
            data += display(value);
        }
    }
    return {
        [HtmlNameSymbol]: HtmlValueSymbol,
        data,
        properties
    };
}
async function render(root, context, component) {
    const componentInstance = component(html, context);
    const { data , properties  } = componentInstance;
    const virtualInstance = virtual(data);
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    patch(root, virtualInstance, properties);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
}
const MountCache = new WeakMap();
async function mount(root, context, component) {
    const update = async function() {
        await schedule(root, renderInstance);
    };
    const contextInstance = ContextCreate(context(html), update);
    const renderInstance = render.bind(null, root, contextInstance, component);
    const cache = MountCache.get(root);
    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
    MountCache.set(root, contextInstance);
    if (contextInstance.connect) await contextInstance.connect()?.catch?.(console.error);
    await update();
    if (contextInstance.connected) await contextInstance.connected()?.catch(console.error);
    return update;
}
const alls = [];
const routes = [];
const transition = async function(route) {
    if (route.render) {
        route.render();
    } else {
        route.render = await mount(route.root, route.context, route.component);
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
export { schedule as Schedule };
export { schedule as schedule };
export { ContextCreate as Context };
export { ContextCreate as context };
export { define as Define };
export { define as define };
export { router as Router };
export { router as router };
export { render as Render };
export { render as render };
export { patch as Patch };
export { patch as patch };
export { mount as Mount };
export { mount as mount };
const Index = {
    Schedule: schedule,
    Context: ContextCreate,
    Define: define,
    Router: router,
    Render: render,
    Patch: patch,
    Mount: mount,
    schedule: schedule,
    context: ContextCreate,
    define: define,
    router: router,
    render: render,
    patch: patch,
    mount: mount
};
export { Index as default };
