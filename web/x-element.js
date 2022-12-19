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
    if (cache.busy) {
        cache.task = task;
        await new Promise(function ScheduleResolve(resolve) {
            cache.resolves.push(resolve);
        });
        return;
    }
    cache.task = task;
    const work = cache.task;
    const resolves = cache.resolves;
    cache.busy = true;
    cache.task = undefined;
    ScheduleNext.then(work).then(function() {
        if (cache.task) {
            return schedule(target, cache.task);
        } else {
            return Promise.all(resolves.map(function ScheduleMap(resolve) {
                return resolve();
            }));
        }
    }).then(function() {
        cache.resolves = [];
        cache.busy = false;
        cache.task = undefined;
        cache.frame = undefined;
    });
    await new Promise(function ScheduleResolve(resolve) {
        cache.resolves.push(resolve);
    });
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
    method();
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
new WeakMap();
function html(strings, ...values) {
    return {
        strings,
        values
    };
}
const TextType = Node.TEXT_NODE;
const ElementType = Node.ELEMENT_NODE;
const CommentType = Node.COMMENT_NODE;
const AttributeType = Node.ATTRIBUTE_NODE;
const FragmentType = Node.DOCUMENT_FRAGMENT_NODE;
const TEXT = 'Text';
const OPEN = 'Open';
const CLOSE = 'Close';
const IGNORE = 'Ignore';
const COMMENT = 'Comment';
const ELEMENT_NAME = 'ElementName';
const ATTRIBUTE_NAME = 'AttributeName';
const ATTRIBUTE_VALUE = 'AttributeValue';
const ELEMENT_CHILDREN = 'ElementChildren';
const ignored = /script|style/i;
const closed = /area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed/i;
const spacePattern = /\s/;
const space = (c)=>spacePattern.test(c);
const patchLastNode = function(rNodeParent, vNodeParent) {
    console.log('parent', rNodeParent, vNodeParent);
    if (!rNodeParent) throw new Error('real node not found');
    if (!vNodeParent) throw new Error('virtual node not found');
    const owner = rNodeParent.ownerDocument;
    if (!owner) throw new Error('owner not found');
    const position = vNodeParent.children.length - 1;
    const vNode = vNodeParent.children[position];
    const rNode = rNodeParent.childNodes[position];
    console.log('child', rNode, vNode);
    if (rNode) {
        if (rNode.nodeName !== vNode.name) {
            if (vNode.type === Node.ELEMENT_NODE) {
                const node = owner.createElement(vNode.name);
                for (const attribute of vNode.attributes){
                    Reflect.set(node, attribute.name, attribute.value);
                    node.setAttribute(attribute.name, attribute.value);
                }
                rNodeParent.replaceChild(node, rNode);
            } else if (vNode.type === Node.TEXT_NODE) {
                rNodeParent.replaceChild(owner.createTextNode(vNode.value), rNode);
            } else if (vNode.type === Node.COMMENT_NODE) {
                rNodeParent.replaceChild(owner.createComment(vNode.value), rNode);
            } else {
                throw new Error('type not handled');
            }
        } else {
            if (vNode.type === Node.ELEMENT_NODE) {
                for (const attribute1 of vNode.attributes){
                    if (rNode.getAttribute(attribute1.name) !== attribute1.value) {
                        Reflect.set(rNode, attribute1.name, attribute1.value);
                        rNode.setAttribute(attribute1.name, attribute1.value);
                    }
                }
            } else if (vNode.type === Node.TEXT_NODE) {
                if (rNode.nodeValue !== vNode.value) {
                    rNode.textContent = vNode.value;
                }
            } else if (vNode.type === Node.COMMENT_NODE) {
                if (rNode.nodeValue !== vNode.value) {
                    rNode.textContent = vNode.value;
                }
            } else {
                throw new Error('type not handled');
            }
        }
    } else {
        if (vNode.type === Node.ELEMENT_NODE) {
            const node1 = owner.createElement(vNode.name);
            for (const attribute2 of vNode.attributes){
                Reflect.set(node1, attribute2.name, attribute2.value);
                node1.setAttribute(attribute2.name, attribute2.value);
            }
            rNodeParent.appendChild(node1);
        } else if (vNode.type === Node.TEXT_NODE) {
            rNodeParent.appendChild(owner.createTextNode(vNode.value));
        } else if (vNode.type === Node.COMMENT_NODE) {
            rNodeParent.appendChild(owner.createComment(vNode.value));
        } else {
            throw new Error('type not handled');
        }
    }
};
function parse(root, values, data) {
    const fragment = {
        type: FragmentType,
        children: [],
        name: 'fragment'
    };
    let i = 0;
    let v = fragment;
    let mode = ELEMENT_CHILDREN;
    let n = root;
    const l = data.length;
    const childrenModeSlash = function() {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        last.closed = true;
        patchLastNode(n, v);
        mode = ELEMENT_CHILDREN;
        i++;
    };
    const childrenModeClosed = function() {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        last.closed = true;
        patchLastNode(n, v);
        mode = ELEMENT_CHILDREN;
    };
    const childrenModeIgnored = function() {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        patchLastNode(n, v);
        last.children.push({
            value: '',
            parent: v,
            name: '#text',
            type: TextType
        });
        mode = IGNORE;
    };
    const childrenMode = function() {
        const last = v.children[v.children.length - 1];
        last.name = last.name.toUpperCase();
        patchLastNode(n, v);
        const length = v.children.length;
        n = n?.childNodes[length - 1];
        v = v?.children[length - 1];
        mode = ELEMENT_CHILDREN;
        console.log('childrenMode -> elementChildrenMode');
    };
    for(i; i < l; i++){
        const c = data[i];
        if (mode === ELEMENT_CHILDREN) {
            const next = data[i + 1];
            if (c === '<' && next === '/') {
                i++;
                v = v.parent;
                n = n?.parentNode;
                mode = CLOSE;
                console.log('elementChildrenMode -> closeMode');
            } else if (c === '<' && next === '!') {
                i++;
                v.children.push({
                    value: '',
                    name: '#comment',
                    parent: v,
                    type: CommentType
                });
                mode = COMMENT;
            } else if (c === '<') {
                v.children.push({
                    name: '',
                    children: [],
                    attributes: [],
                    parent: v,
                    type: ElementType
                });
                mode = ELEMENT_NAME;
                console.log('elementChildrenMode -> elementNameMode');
            } else {
                v.children.push({
                    value: c,
                    name: '#text',
                    parent: v,
                    type: TextType
                });
                mode = TEXT;
                console.log('elementChildrenMode -> textMode');
            }
        } else if (mode === ELEMENT_NAME) {
            const last = v.children[v.children.length - 1];
            if (space(c)) {
                mode = OPEN;
            } else if (c === '/') {
                childrenModeSlash();
            } else if (c === '>' && closed.test(last.name)) {
                childrenModeClosed();
            } else if (c === '>' && ignored.test(last.name)) {
                childrenModeIgnored();
            } else if (c === '>') {
                childrenMode();
            } else if (mode === ELEMENT_NAME) {
                last.name += c;
            }
        } else if (mode === ATTRIBUTE_NAME) {
            const last1 = v.children[v.children.length - 1];
            if (space(c)) {
                mode = OPEN;
            } else if (c === '/') {
                childrenModeSlash();
            } else if (c === '>' && closed.test(last1.name)) {
                childrenModeClosed();
            } else if (c === '>' && ignored.test(last1.name)) {
                childrenModeIgnored();
            } else if (c === '>') {
                childrenMode();
            } else if (c === '=') {
                if (data[i + 1] === '"') {
                    i++;
                    last1.attributes[v.attributes.length - 1].quoted = true;
                }
                mode = ATTRIBUTE_VALUE;
            } else {
                last1.attributes[v.attributes.length - 1].name += c;
            }
        } else if (mode === ATTRIBUTE_VALUE) {
            const last2 = v.children[v.children.length - 1];
            const attribute = last2.attributes[v.attributes.length - 1];
            if (attribute.quoted) {
                if (c === '"') {
                    mode = OPEN;
                } else {
                    attribute.value += c;
                }
            } else if (space(c)) {
                mode = OPEN;
            } else if (c === '/') {
                childrenModeSlash();
            } else if (c === '>' && closed.test(last2.name)) {
                childrenModeClosed();
            } else if (c === '>' && ignored.test(last2.name)) {
                childrenModeIgnored();
            } else if (c === '>') {
                childrenMode();
            } else {
                attribute.value += c;
            }
        } else if (mode === CLOSE) {
            if (c === '>') {
                mode = ELEMENT_CHILDREN;
            } else {
                continue;
            }
        } else if (mode === OPEN) {
            const last3 = v.children[v.children.length - 1];
            if (space(c)) {
                continue;
            } else if (c === '/') {
                childrenModeSlash();
            } else if (c === '>' && closed.test(last3.name)) {
                childrenModeClosed();
            } else if (c === '>' && ignored.test(last3.name)) {
                childrenModeIgnored();
            } else if (c === '>') {
                childrenMode();
            } else {
                last3.attributes.push({
                    name: c,
                    value: '',
                    type: AttributeType
                });
                mode = ATTRIBUTE_NAME;
            }
        } else if (mode === TEXT) {
            const next1 = data[i + 1];
            if (c === '<' && next1 === '/') {
                patchLastNode(n, v);
                v = v.parent;
                n = n?.parentNode;
                i++;
                mode = CLOSE;
                console.log('textMode -> closeMode');
            } else if (c === '<' && next1 === '!') {
                patchLastNode(n, v);
                v.children.push({
                    value: '',
                    name: '#comment',
                    parent: v.parent,
                    type: CommentType
                });
                i++;
                mode = COMMENT;
                console.log('textMode -> commentMode');
            } else if (c === '<') {
                patchLastNode(n, v);
                v.children.push({
                    name: '',
                    children: [],
                    attributes: [],
                    parent: v.parent,
                    type: ElementType
                });
                mode = ELEMENT_NAME;
                console.log('textMode -> elementNameMode');
            } else if (c === '}' && next1 === '}') {
                const last4 = v.children[v.children.length - 1];
                last4.value = values[last4.value];
                patchLastNode(n, v);
                v.children.push({
                    value: '',
                    name: '#text',
                    parent: v,
                    type: TextType
                });
                i++;
                console.log('textDynamicMode -> textMode');
            } else if (c === '{' && next1 === '{') {
                console.log('HERE', n, v);
                patchLastNode(n, v);
                v.children.push({
                    name: '#text',
                    value: '',
                    parent: v,
                    type: TextType
                });
                i++;
                console.log('textMode -> textDynamicMode');
            } else {
                const last5 = v.children[v.children.length - 1];
                last5.value += c;
            }
        } else if (mode === COMMENT) {
            if (c === '>') {
                if (v.last.value.startsWith('--')) v.last.value = v.last.value.slice(2);
                if (v.last.value.endsWith('--')) v.last.value = v.last.value.slice(0, -2);
                mode = ELEMENT_CHILDREN;
            } else {
                v.last.value += c;
            }
        } else if (mode === IGNORE) {
            const last6 = v.children[v.children.length - 1][0];
            if (c === '>') {
                last6.value = last6.value.slice(0, -(last6.name.length + 2));
                patchLastNode(n, v);
                mode = ELEMENT_CHILDREN;
            } else {
                last6.value += c;
            }
        }
    }
    return fragment;
}
async function render(root, context, component) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    const { strings , values  } = component(html, context);
    let data = '';
    const length = strings.length - 1;
    for(let index = 0; index < length; index++){
        const value = values[index];
        if (value?.constructor === Array) {
            data += `${strings[index]}`;
            for (const child of value){
                for(let ii = 0; ii < child.strings.length; ii++){
                    data += `${child.strings[ii]}${child.values[ii] ?? ''}`;
                }
            }
        } else {
            data += `${strings[index]}{{${index}}}`;
        }
    }
    data += strings[strings.length - 1];
    const parsed = parse(root, values, data);
    console.log(parsed);
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
new WeakMap();
const attribute = function(element, name, value) {
    if (name === 'value') {
        const result = display(value);
        if (element.getAttribute(name) === result) return;
        Reflect.set(element, name, result);
        element.setAttribute(name, result);
    } else if (name.startsWith('on')) {
        element.setAttribute(name, value);
    } else if (booleans.includes(name)) {
        const result1 = value ? true : false;
        const has = element.hasAttribute(name);
        if (has === result1) return;
        Reflect.set(element, name, result1);
        if (result1) element.setAttribute(name, '');
        else element.removeAttribute(name);
    } else {
        if (element.getAttribute(name) === value) return;
        Reflect.set(element, name, value);
        element.setAttribute(name, value);
    }
};
const create = function(owner, node) {
    const element = owner.createElement(node.name);
    const children = node.children;
    for (const child of children){
        append(element, child);
    }
    const attributes = node.attributes;
    for (const { name , value  } of attributes){
        attribute(element, name, value);
    }
    return element;
};
const append = function(parent, child) {
    const owner = parent.ownerDocument;
    if (child.type === Node.ELEMENT_NODE) {
        parent.appendChild(create(owner, child));
    } else if (child.type === Node.COMMENT_NODE) {
        parent.appendChild(owner.createComment(child.value));
    } else if (child.type === Node.CDATA_SECTION_NODE) {
        parent.appendChild(owner.createCDATASection(child.value));
    } else if (child.type === Node.TEXT_NODE) {
        parent.appendChild(owner.createTextNode(child.value));
    } else {
        console.error(child);
        throw new Error('child type not handled');
    }
};
const remove = function(parent) {
    const child = parent.lastChild;
    if (child) parent.removeChild(child);
};
const common = function(source, target) {
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
        source.parentNode?.replaceChild(create(owner, target), source);
        return;
    }
    if (!(source instanceof Element)) {
        console.log(source, target);
        throw new Error('source node not valid');
    }
    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    let index;
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index]);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index]);
        }
    }
    const attributes = target.attributes;
    for (const { name , value  } of attributes){
        attribute(source, name, value);
    }
};
function patch(source, target) {
    let index;
    const targetChildren = target.children;
    const targetLength = targetChildren.length;
    const sourceChildren = source.childNodes;
    const sourceLength = sourceChildren.length;
    const commonLength = Math.min(sourceLength, targetLength);
    for(index = 0; index < commonLength; index++){
        common(sourceChildren[index], targetChildren[index]);
    }
    if (sourceLength > targetLength) {
        for(index = targetLength; index < sourceLength; index++){
            remove(source);
        }
    } else if (sourceLength < targetLength) {
        for(index = sourceLength; index < targetLength; index++){
            append(source, targetChildren[index]);
        }
    }
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
