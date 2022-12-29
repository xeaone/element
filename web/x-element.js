// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

let busy = false;
const sleep = ()=>new Promise((resolve)=>setTimeout(resolve, 0));
const Actions = [];
const OldValues = [];
const NewValues = [];
async function schedule(actions, oldValues, newValues) {
    actions = actions ?? [];
    oldValues = oldValues ?? [];
    newValues = newValues ?? [];
    Actions.push(...actions);
    OldValues.push(...oldValues);
    NewValues.push(...newValues);
    if (busy) return;
    busy = true;
    let action;
    let oldValue;
    let newValue;
    let max = performance.now() + 50;
    while(Actions.length > 0){
        if (navigator.scheduling?.isInputPending() || performance.now() >= max) {
            await sleep();
            max = performance.now() + 50;
            continue;
        }
        action = Actions.shift();
        oldValue = OldValues.shift();
        newValue = NewValues.shift();
        if (oldValue !== newValue) {
            await action(oldValue, newValue);
        }
    }
    busy = false;
}
function define(name, constructor) {
    customElements.define(name, constructor);
}
const HtmlCache = new WeakMap();
const HtmlSymbol = Symbol('html');
function html(strings, ...values) {
    if (HtmlCache.has(strings)) {
        const template = HtmlCache.get(strings);
        return {
            strings,
            values,
            template,
            symbol: HtmlSymbol
        };
    } else {
        let data = '';
        const length = strings.length - 1;
        for(let index = 0; index < length; index++){
            data += `${strings[index]}{{${index}}}`;
        }
        data += strings[length];
        const template1 = document.createElement('template');
        template1.innerHTML = data;
        HtmlCache.set(strings, template1);
        return {
            strings,
            values,
            template: template1,
            symbol: HtmlSymbol
        };
    }
}
function display(data) {
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
            throw new Error('display - type not handled');
    }
}
const ObserveCache = new WeakMap();
const ObserveNext = Promise.resolve();
const ObserveSet = function(method, target, key, value, receiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);
    const from = Reflect.get(target, key, receiver);
    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;
    if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
        const cache = ObserveCache.get(from);
        if (cache === value) return true;
        ObserveCache.delete(from);
    }
    Reflect.set(target, key, value, receiver);
    ObserveNext.then(method);
    return true;
};
const ObserveGet = function(method, target, key, receiver) {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    const value = Reflect.get(target, key, receiver);
    if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
        const cache = ObserveCache.get(value);
        if (cache) return cache;
        const proxy = new Proxy(value, {
            get: ObserveGet.bind(null, method),
            set: ObserveSet.bind(null, method),
            deleteProperty: ObserveDelete.bind(null, method)
        });
        ObserveCache.set(value, proxy);
        return proxy;
    }
    if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
        const cache1 = ObserveCache.get(value);
        if (cache1) return cache1;
        const proxy1 = new Proxy(value, {
            apply (t, _, a) {
                return Reflect.apply(t, receiver, a);
            }
        });
        ObserveCache.set(value, proxy1);
        return proxy1;
    }
    return value;
};
const ObserveDelete = function(method, target, key) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    const from = Reflect.get(target, key);
    ObserveCache.delete(from);
    Reflect.deleteProperty(target, key);
    ObserveNext.then(method);
    return true;
};
const Observe = function(data, method) {
    return new Proxy(data, {
        get: ObserveGet.bind(null, method),
        set: ObserveSet.bind(null, method),
        deleteProperty: ObserveDelete.bind(null, method)
    });
};
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
const RootCache = new WeakMap();
const ObjectAction = function(start, end, actions, oldValue, newValue) {
    oldValue = oldValue ?? {};
    newValue = newValue ?? {};
    if (oldValue?.strings !== newValue.strings) {
        let next;
        let node = end.previousSibling;
        while(node !== start){
            next = node?.previousSibling;
            node?.parentNode?.removeChild(node);
            node = next;
        }
        const fragment = newValue.template.content.cloneNode(true);
        RenderWalk(fragment, newValue.values, actions);
        const l = actions.length;
        for(let i = 0; i < l; i++){
            actions[i](oldValue.values?.[i], newValue.values[i]);
        }
        end.parentNode?.insertBefore(fragment, end);
    } else {
        const l1 = actions.length;
        for(let i1 = 0; i1 < l1; i1++){
            actions[i1](oldValue.values?.[i1], newValue.values[i1]);
        }
    }
};
const ArrayAction = function(start, end, actions, oldValue, newValue) {
    oldValue = oldValue ?? [];
    newValue = newValue ?? [];
    const oldLength = oldValue.length;
    const newLength = newValue.length;
    const common = Math.min(oldLength, newLength);
    for(let i = 0; i < common; i++){
        actions[i](oldValue[i], newValue[i]);
    }
    if (oldLength < newLength) {
        const template = document.createElement('template');
        for(let i1 = oldLength; i1 < newLength; i1++){
            if (newValue[i1]?.constructor === Object && newValue[i1]?.symbol === HtmlSymbol) {
                const start1 = document.createTextNode('');
                const end1 = document.createTextNode('');
                const action = ObjectAction.bind(null, start1, end1, []);
                template.content.appendChild(start1);
                template.content.appendChild(end1);
                actions.push(action);
                action(oldValue[i1], newValue[i1]);
            } else {
                const node = document.createTextNode('');
                const action1 = StandardAction.bind(null, node);
                template.content.appendChild(node);
                actions.push(action1);
                action1(oldValue[i1], newValue[i1]);
            }
        }
        end.parentNode?.insertBefore(template.content, end);
    } else if (oldLength > newLength) {
        for(let i2 = oldLength; i2 !== newLength; i2--){
            if (oldValue[i2]?.constructor === Object && oldValue[i2]?.symbol === HtmlSymbol) {
                const { template: template1  } = oldValue[i2];
                let removes = template1.content.childNodes.length + 2;
                while(removes--)end.parentNode?.removeChild(end.previousSibling);
            } else {
                end.parentNode?.removeChild(end.previousSibling);
            }
        }
        actions.length = newLength;
    }
};
const StandardAction = function(node, oldValue, newValue) {
    if (oldValue === newValue) return;
    node.textContent = newValue;
};
const AttributeOn = function(node, attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (typeof oldValue === 'function') node.removeEventListener(attribute.name.slice(2), oldValue);
    node.addEventListener(attribute.name.slice(2), newValue);
};
const AttributeBoolean = function(element, attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    const value = newValue ? true : false;
    if (value) element.setAttribute(attribute.name, '');
    else element.removeAttribute(attribute.name);
};
const AttributeValue = function(element, attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    const value = display(newValue);
    Reflect.set(element, attribute.name, value);
    element.setAttribute(attribute.name, value);
};
const AttributeStandard = function(node, attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    attribute.value = newValue;
    node.setAttribute(attribute.name, attribute.value);
};
const AttributeName = function(element, attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    attribute.name = newValue;
    element.removeAttribute(oldValue);
    element.setAttribute(attribute.name, attribute.value);
};
const RenderWalk = function(fragment, values, actions) {
    const walker = document.createTreeWalker(document, 5, null);
    walker.currentNode = fragment;
    let index = 0;
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
            const newValue = values[index++];
            if (newValue?.constructor === Object && newValue?.symbol === HtmlSymbol) {
                const start1 = document.createTextNode('');
                const end1 = node;
                end1.nodeValue = '';
                end1.parentNode?.insertBefore(start1, end1);
                actions.push(ObjectAction.bind(null, start1, end1, []));
            } else if (newValue?.constructor === Array) {
                const start2 = document.createTextNode('');
                const end2 = node;
                end2.nodeValue = '';
                end2.parentNode?.insertBefore(start2, end2);
                actions.push(ArrayAction.bind(null, start2, end2, []));
            } else {
                actions.push(StandardAction.bind(null, node));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const names = node.getAttributeNames();
            for (const name of names){
                const value = node.getAttribute(name) ?? '';
                const attribute = {
                    name,
                    value
                };
                if (name.includes('{{') && name.includes('}}')) {
                    index++;
                    node.removeAttribute(name);
                    actions.push(AttributeName.bind(null, node, attribute));
                }
                if (value.includes('{{') && value.includes('}}')) {
                    index++;
                    if (name === 'value') {
                        actions.push(AttributeValue.bind(null, node, attribute));
                    } else if (booleans.includes(name)) {
                        actions.push(AttributeBoolean.bind(null, node, attribute));
                    } else if (name.startsWith('on')) {
                        node.removeAttribute(name);
                        actions.push(AttributeOn.bind(null, node, attribute));
                    } else {
                        actions.push(AttributeStandard.bind(null, node, attribute));
                    }
                }
            }
        } else {
            console.warn('node type not handled ', node.nodeType);
        }
    }
};
const sleep1 = (time)=>new Promise((resolve)=>setTimeout(resolve, time ?? 0));
const render = async function(root, context, component) {
    const instance = {};
    const update = async function() {
        if (instance.busy) return;
        else instance.busy = true;
        await sleep1(50);
        if (context.upgrade) await context.upgrade()?.catch?.(console.error);
        const { values  } = component(html, context);
        const length = instance.actions.length;
        for(let index = 0; index < length; index++){
            instance.actions[index](instance.values[index], values[index]);
        }
        instance.values = values;
        if (context.upgraded) await context.upgraded()?.catch(console.error);
        instance.busy = false;
    };
    const cache = RootCache.get(root);
    if (cache && cache.disconnect) await cache.disconnect()?.catch?.(console.error);
    if (cache && cache.disconnected) await cache.disconnected()?.catch(console.error);
    context = Observe(context(html), update);
    RootCache.set(root, context);
    if (context.connect) await context.connect()?.catch?.(console.error);
    if (context.upgrade) await context.upgrade()?.catch?.(console.error);
    const { strings , values , template  } = component(html, context);
    instance.busy = false;
    instance.actions = [];
    instance.values = values;
    instance.strings = strings;
    instance.template = template;
    instance.fragment = template.content.cloneNode(true);
    RenderWalk(instance.fragment, instance.values, instance.actions);
    const length = instance.actions.length;
    for(let index = 0; index < length; index++){
        instance.actions[index](undefined, values[index]);
    }
    root.replaceChildren(instance.fragment);
    if (context.upgraded) await context.upgraded()?.catch(console.error);
    if (context.connected) await context.connected()?.catch(console.error);
};
const alls = [];
const routes = [];
const transition = async function(route) {
    await render(route.root, route.context, route.component);
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
const router = function(path, root, context, component) {
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
};
export { schedule as Schedule };
export { schedule as schedule };
export { define as Define };
export { define as define };
export { router as Router };
export { router as router };
export { render as Render };
export { render as render };
const Index = {
    Schedule: schedule,
    Define: define,
    Router: router,
    Render: render,
    schedule: schedule,
    define: define,
    router: router,
    render: render
};
export { Index as default };
