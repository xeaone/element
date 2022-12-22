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
const HtmlCache = new WeakMap();
function html(strings, ...values) {
    if (HtmlCache.has(strings)) {
        const template = HtmlCache.get(strings);
        return {
            strings,
            values,
            template
        };
    } else {
        let data = '';
        const length = strings.length - 1;
        for(let index = 0; index < length; index++){
            data += `${strings[index]}{{${index}}}`;
        }
        data += strings[strings.length - 1];
        const template1 = document.createElement('template');
        template1.innerHTML = data;
        HtmlCache.set(strings, template1);
        return {
            strings,
            values,
            template: template1
        };
    }
}
window.x = {};
const RenderCache = new WeakMap();
new WeakMap();
const RenderRun = function(strings, values) {
    const cache = RenderCache.get(strings);
    const l = values.length;
    for(let i = 0; i < l; i++){
        const newValue = values[i];
        const oldValue = cache.values[i];
        if (newValue?.constructor === Object) continue;
        if (newValue !== oldValue) {
            cache.actions[i](newValue, oldValue);
            cache.values[i] = values[i];
        }
    }
};
const RenderWalk = function(fragment, values, actions) {
    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = fragment;
    let node = fragment.firstChild;
    while((node = walker.nextNode()) !== null){
        if (node.nodeType === Node.TEXT_NODE) {
            const start = node.nodeValue?.indexOf('{{') ?? -1;
            if (start == -1) continue;
            if (start != 0) {
                node.splitText(start);
                node = walker.nextNode();
            }
            const end = node.nodeValue?.indexOf('}}') ?? -1;
            if (end == -1) continue;
            if (end + 2 != node.nodeValue?.length) {
                node.splitText(end + 2);
            }
            const newValue = values[actions.length];
            const oldValue = node.nodeValue;
            if (newValue?.constructor === Array) {
                const start1 = document.createTextNode('');
                const end1 = node;
                end1.nodeValue = '';
                end1.parentNode?.insertBefore(start1, end1);
                const action = (function(start, end, newValue, oldValue) {
                    console.log('TODO: need to patch common');
                    if (newValue.length > oldValue.length) {
                        const l = newValue.length - oldValue.length;
                        for(let i = 0; i < l; i++){
                            const { values , template  } = newValue[i];
                            const fragment = template.content.cloneNode(true);
                            RenderWalk(fragment, values, []);
                            end.parentNode?.insertBefore(fragment, end);
                        }
                    } else if (newValue.length < oldValue.length) {
                        const { template: template1  } = oldValue[0];
                        let r = (oldValue.length - newValue.length) * template1.content.childNodes.length;
                        while(r){
                            end.parentNode?.removeChild(end.previousSibling);
                            r--;
                        }
                    }
                }).bind(null, start1, end1);
                action(newValue, []);
                actions.push(action);
            } else {
                const action1 = (function(node, newValue, oldValue) {
                    node.nodeValue = newValue;
                }).bind(null, node);
                action1(newValue, oldValue);
                actions.push(action1);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const attributes = [
                ...node.attributes
            ];
            for (const attribute of attributes){
                if (attribute.value.includes('{{') && attribute.value.includes('}}')) {
                    if (attribute.name.startsWith('on')) {
                        const action2 = (function(node, attribute, newValue, oldValue) {
                            node.addEventListener(attribute.name.slice(2), newValue);
                        }).bind(null, node, attribute);
                        node.removeAttributeNode(attribute);
                        action2(values[actions.length], attribute.value);
                        actions.push(action2);
                    } else {
                        const action3 = (function(node, attribute, newValue, oldValue) {
                            node.setAttribute(attribute.name, newValue);
                        }).bind(null, node, attribute);
                        action3(values[actions.length], attribute.value);
                        actions.push(action3);
                    }
                }
            }
        }
    }
};
async function render(root, context, component) {
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    const { strings , values , template  } = component(html, context);
    let cache = RenderCache.get(strings);
    if (cache) {
        RenderRun(strings, values);
        return cache;
    }
    cache = {
        values,
        actions: [],
        rooted: false,
        fragment: template.content.cloneNode(true)
    };
    RenderCache.set(strings, cache);
    RenderWalk(cache.fragment, values, cache.actions);
    if (!cache.rooted) {
        cache.rooted = true;
        root.replaceChildren(cache.fragment);
    }
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
