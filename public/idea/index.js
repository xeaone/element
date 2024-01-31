var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __export = (target, all) => {
    for (var name in all) {
        __defProp(target, name, { get: all[name], enumerable: true });
    }
};
var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--) {
        if (decorator = decorators[i]) {
            result = (kind ? decorator(target, key, result) : decorator(result)) || result;
        }
    }
    if (kind && result) {
        __defProp(target, key, result);
    }
    return result;
};

// source/poly.ts
var replaceChildren = function (element, ...nodes) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
    if (nodes?.length) {
        for (const node of nodes) {
            element.appendChild(
                typeof node === 'string' ? element.ownerDocument.createTextNode(node) : node,
            );
        }
    }
};
var policy = 'trustedTypes' in window ? window.trustedTypes.createPolicy('x-element', { createHTML: (data) => data }) : void 0;
var createHTML = function (data) {
    if (policy) {
        return policy.createHTML(data);
    } else {
        return data;
    }
};

// source/dash.ts
function dash(data) {
    data = data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2');
    data = data.toLowerCase();
    data = data.includes('-') ? data : `x-${data}`;
    return data;
}

// source/upgrade.ts
var upgrade_default = (instance) => {
    if (customElements.upgrade) {
        customElements.upgrade(instance);
    }
};

// source/router.ts
var alls = [];
var routes = [];
var tick = function (element) {
    return new Promise(async (resolve) => {
        if (element && element) {
            requestAnimationFrame(() => resolve(void 0));
        } else {
            requestAnimationFrame(() => resolve(void 0));
        }
    });
};
var transition = async function (route) {
    if (route.instance) {
        const ready = tick(route.instance);
        replaceChildren(route.root, route.instance);
        await ready;
    } else {
        const result = await route.handler();
        if (result?.prototype instanceof HTMLElement) {
            route.construct = result;
        } else if (result?.default?.prototype instanceof HTMLElement) {
            route.construct = result.default;
        } else {
            throw new Error('XElement - router handler requires Module or CustomElementConstructor');
        }
        route.tag = dash(route.construct.name);
        if (customElements.get(route.tag) !== route.construct) {
            customElements.define(route.tag, route.construct);
        }
        route.instance = document.createElement(route.tag);
        upgrade_default(route.instance);
        const ready = tick(route.instance);
        replaceChildren(route.root, route.instance);
        await ready;
    }
};
var navigate = function (event) {
    if (event && 'canIntercept' in event && event.canIntercept === false) {
        return;
    }
    if (event && 'canTransition' in event && event.canTransition === false) {
        return;
    }
    const destination = new URL(event?.destination.url ?? location.href);
    const base = new URL(document.querySelector('base')?.href ?? location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    const pathname = destination.href.replace(base.href, '/');
    const transitions = [];
    for (const route of routes) {
        if (route.path !== pathname) {
            continue;
        }
        transitions.push(route);
    }
    for (const all of alls) {
        let has = false;
        for (const transition2 of transitions) {
            if (transition2.root === all.root) {
                has = true;
                break;
            }
        }
        if (has) {
            continue;
        }
        transitions.push(all);
    }
    if (event?.intercept) {
        return event.intercept({
            handler: async () => {
                await Promise.all(transitions.map((route) => transition(route)));
            },
        });
    } else if (event?.transitionWhile) {
        return event.transitionWhile(Promise.all(transitions.map((route) => transition(route))));
    } else {
        Promise.all(transitions.map((route) => transition(route)));
    }
};
var router = function (path, root, handler) {
    if (!path) {
        throw new Error('XElement - router path required');
    }
    if (!handler) {
        throw new Error('XElement - router handler required');
    }
    if (!root) {
        throw new Error('XElement - router root required');
    }
    if (path === '/*') {
        for (const all of alls) {
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        alls.push({ path, root, handler });
    } else {
        for (const route of routes) {
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        routes.push({ path, root, handler, instance: void 0 });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};
var router_default = router;

// source/mark.ts
var mark_default = () => Math.floor(Math.random() * Date.now());

// source/html.ts
var symbol = Symbol('html');
var cache = /* @__PURE__ */ new WeakMap();
function html(strings, ...expressions) {
    const value = cache.get(strings);
    if (value) {
        const [template, marker] = value;
        return { strings, template, expressions, symbol, marker };
    } else {
        const marker = `x-${mark_default()}-x`;
        let data = '';
        const length = strings.length - 1;
        for (let index = 0; index < length; index++) {
            data += `${strings[index]}${marker}`;
        }
        data += strings[length];
        const template = document.createElement('template');
        template.innerHTML = createHTML(data);
        cache.set(strings, [template, marker]);
        return { strings, template, expressions, symbol, marker };
    }
}

// source/symbols.ts
var symbols_exports = {};
__export(symbols_exports, {
    adopted: () => adopted,
    attributed: () => attributed,
    connected: () => connected,
    create: () => create,
    created: () => created,
    disconnected: () => disconnected,
    extend: () => extend,
    internal: () => internal,
    render: () => render,
    rendered: () => rendered,
    state: () => state,
    tag: () => tag,
    update: () => update,
});
var update = Symbol('XUpdate');
var create = Symbol('XCreate');
var created = Symbol('XCreated');
var adopted = Symbol('XAdopted');
var rendered = Symbol('XRendered');
var connected = Symbol('XConnected');
var attributed = Symbol('XAttributed');
var disconnected = Symbol('XDisconnected');
var tag = Symbol('XTag');
var extend = Symbol('XExtend');
var internal = Symbol('XInternal');
var state = Symbol('XState');
var render = Symbol('XRender');

// source/mount.ts
var mount_exports = {};
__export(mount_exports, {
    default: () => mount_default,
    mount: () => mount,
});
var init = (target, selector) => {
    Object.defineProperties(target, { $mount: { value: selector } });
    if (!target.$tag) {
        throw new Error('static tag required');
    }
    if (!target.$mount) {
        throw new Error('static mount required');
    }
    const $extend = target.$extend;
    const $tag = target.$tag;
    const $mount = target.$mount;
    const ready = () => {
        const container = $mount === 'body' ? document.body : document.querySelector($mount);
        if (!container) {
            throw new Error('XElement mount - container not found');
        }
        const element = document.createElement($extend || $tag, $extend ? { is: $tag } : void 0);
        customElements.upgrade(element);
        replaceChildren(container, element);
    };
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', ready, { once: true });
    } else {
        ready();
    }
    return target;
};
var mount = function (selector) {
    return (constructor, context) => {
        if (context !== void 0) {
            return context.addInitializer(() => init(constructor, selector));
        } else {
            return init(constructor, selector);
        }
    };
};
var mount_default = mount;

// source/define.ts
var define_exports = {};
__export(define_exports, {
    default: () => define_default,
    define: () => define,
});

// source/tools.ts
var links = [
    'src',
    'href',
    'data',
    'action',
    'srcdoc',
    'xlink:href',
    'cite',
    'formaction',
    'ping',
    'poster',
    'background',
    'classid',
    'codebase',
    'longdesc',
    'profile',
    'usemap',
    'icon',
    'manifest',
    'archive',
];
var bools = [
    'hidden',
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected',
];
var isLink = function (data) {
    return data && typeof data === 'string' ? links.indexOf(data) !== -1 : false;
};
var isBool = function (data) {
    return data && typeof data === 'string' ? bools.indexOf(data) !== -1 : false;
};
var patternValue = /^value$/i;
var isValue = function (data) {
    return data && typeof data === 'string' ? patternValue.test(data) : false;
};
var patternOn = /^on/i;
var hasOn = function (data) {
    return data && typeof data === 'string' ? patternOn.test(data) : false;
};
var sliceOn = function (data) {
    return data && typeof data === 'string' ? data?.toLowerCase()?.slice(2) : '';
};
var isMarker = function (data, marker) {
    return data && typeof data === 'string' ? data.toLowerCase() === marker.toLowerCase() : false;
};
var hasMarker = function (data, marker) {
    return data && typeof data === 'string' ? data.toLowerCase().indexOf(marker.toLowerCase()) !== -1 : false;
};
var safePattern = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
var dangerousLink = function (data) {
    if (data === '') {
        return false;
    }
    if (typeof data !== 'string') {
        return false;
    }
    return safePattern.test(data) ? false : true;
};
var removeBetween = function (start, end) {
    let node = end.previousSibling;
    while (node !== start) {
        node?.parentNode?.removeChild(node);
        node = end.previousSibling;
    }
};

// source/display.ts
function display(data) {
    switch (`${data}`) {
        case 'NaN':
            return '';
        case 'null':
            return '';
        case 'undefined':
            return '';
    }
    switch (typeof data) {
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
    }
    throw new Error('XElement - display type not handled');
}

// source/bind.ts
var FILTER = 1 + 4;
var TEXT_NODE = 3;
var ELEMENT_NODE = 1;
var ElementAction = function (source, target) {
    if (target?.symbol === symbol) {
        source = source ?? {};
        target = target ?? {};
        if (source.strings === target.strings) {
            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[i](source.expressions[i], target.expressions[i]);
            }
        } else {
            this.actions.length = 0;
            const fragment = target.template.content.cloneNode(true);
            Bind(fragment, this.actions, target.marker);
            const l = this.actions.length;
            for (let i = 0; i < l; i++) {
                this.actions[i](source.expressions?.[i], target.expressions[i]);
            }
            document.adoptNode(fragment);
            removeBetween(this.start, this.end);
            this.end.parentNode?.insertBefore(fragment, this.end);
        }
    } else if (target?.constructor === Array) {
        source = source ?? [];
        target = target ?? [];
        const oldLength = source.length;
        const newLength = target.length;
        const common = Math.min(oldLength, newLength);
        for (let i = 0; i < common; i++) {
            this.actions[i](source[i], target[i]);
        }
        if (oldLength < newLength) {
            const template = document.createElement('template');
            for (let i = oldLength; i < newLength; i++) {
                const startChild = document.createTextNode('');
                const endChild = document.createTextNode('');
                const action = ElementAction.bind({
                    start: startChild,
                    end: endChild,
                    actions: [],
                });
                template.content.appendChild(startChild);
                template.content.appendChild(endChild);
                this.actions.push(action);
                action(source[i], target[i]);
            }
            this.end.parentNode?.insertBefore(template.content, this.end);
        } else if (oldLength > newLength) {
            for (let i = oldLength - 1; i > newLength - 1; i--) {
                if (source[i]?.symbol === symbol) {
                    const { template } = source[i];
                    let removes = template.content.childNodes.length + 2;
                    while (removes--) {
                        this.end.parentNode?.removeChild(this.end.previousSibling);
                    }
                } else {
                    this.end.parentNode?.removeChild(this.end.previousSibling);
                    this.end.parentNode?.removeChild(this.end.previousSibling);
                    this.end.parentNode?.removeChild(this.end.previousSibling);
                }
            }
            this.actions.length = newLength;
        }
    } else {
        if (source === target) {
            return;
        } else if (this.end.previousSibling === this.start) {
            this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
        } else if (this.end.previousSibling?.nodeType === TEXT_NODE && this.end.previousSibling?.previousSibling === this.start) {
            this.end.previousSibling.textContent = display(target);
        } else {
            removeBetween(this.start, this.end);
            this.end.parentNode?.insertBefore(document.createTextNode(display(target)), this.end);
        }
    }
};
var AttributeNameAction = function (source, target) {
    if (source === target) {
        return;
    } else if (isValue(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, null);
    } else if (hasOn(source)) {
        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(source), this.value, true);
        }
    } else if (isLink(source)) {
        this.element.removeAttribute(source);
    } else if (isBool(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, false);
    } else if (source) {
        this.element.removeAttribute(source);
        Reflect.deleteProperty(this.element, source);
    }
    this.name = target?.toLowerCase() || '';
    if (!this.name) {
        return;
    } else if (hasOn(this.name)) {
        return;
    } else if (isBool(this.name)) {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, true);
    } else {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, void 0);
    }
};
var AttributeValueAction = function (source, target) {
    if (source === target) {
        return;
    } else if (isValue(this.name)) {
        this.value = display(target);
        if (!this.name) {
            return;
        }
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);
    } else if (hasOn(this.name)) {
        if (!this.name) {
            return;
        }
        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(this.name), this.value, true);
        }
        if (typeof target !== 'function') {
            return console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
        }
        this.value = function () {
            return target.call(this, ...arguments);
        };
        this.element.addEventListener(sliceOn(this.name), this.value, true);
    } else if (isLink(this.name)) {
        this.value = encodeURI(target);
        if (!this.name) {
            return;
        }
        if (dangerousLink(this.value)) {
            this.element.removeAttribute(this.name);
            console.warn(`XElement - attribute name "${this.name}" and value "${this.value}" not allowed`);
            return;
        }
        this.element.setAttribute(this.name, this.value);
    } else {
        this.value = target;
        if (!this.name) {
            return;
        }
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);
    }
};
var TagAction = function (source, target) {
    if (source === target) {
        return;
    }
    const oldElement = this.element;
    if (target) {
        oldElement.parentNode?.removeChild(oldElement);
        const newElement = document.createElement(target);
        while (oldElement.firstChild) {
            newElement.appendChild(oldElement.firstChild);
        }
        if (oldElement.nodeType === ELEMENT_NODE) {
            const attributeNames = oldElement.getAttributeNames();
            for (const attributeName of attributeNames) {
                const attributeValue = oldElement.getAttribute(attributeName) ?? '';
                newElement.setAttribute(attributeName, attributeValue);
            }
        }
        this.holder.parentNode?.insertBefore(newElement, this.holder);
        this.element = newElement;
    } else {
        oldElement.parentNode?.removeChild(oldElement);
        this.element = oldElement;
    }
};
var Bind = function (fragment, actions, marker) {
    const holders = /* @__PURE__ */ new WeakSet();
    const walker = document.createTreeWalker(fragment, FILTER, null);
    walker.currentNode = fragment;
    let node = fragment.firstChild;
    while (node = walker.nextNode()) {
        if (holders.has(node.previousSibling)) {
            holders.delete(node.previousSibling);
            actions.push(() => void 0);
        }
        if (node.nodeType === TEXT_NODE) {
            const startIndex = node.nodeValue?.indexOf(marker) ?? -1;
            if (startIndex === -1) {
                continue;
            }
            if (startIndex !== 0) {
                node.splitText(startIndex);
                node = walker.nextNode();
            }
            const endIndex = marker.length;
            if (endIndex !== node.nodeValue?.length) {
                node.splitText(endIndex);
            }
            const start = document.createTextNode('');
            const end = node;
            end.textContent = '';
            end.parentNode?.insertBefore(start, end);
            actions.push(ElementAction.bind({ marker, start, end, actions: [] }));
        } else if (node.nodeType === ELEMENT_NODE) {
            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }
            const tMeta = {
                element: node,
            };
            if (isMarker(node.nodeName, marker)) {
                holders.add(node);
                tMeta.holder = document.createTextNode('');
                node.parentNode?.insertBefore(tMeta.holder, node);
                actions.push(TagAction.bind(tMeta));
            }
            const names = node.getAttributeNames();
            for (const name of names) {
                const value = node.getAttribute(name) ?? '';
                if (hasMarker(name, marker) || hasMarker(value, marker)) {
                    const aMeta = {
                        name,
                        value,
                        previous: void 0,
                        get element() {
                            return tMeta.element;
                        },
                    };
                    if (hasMarker(name, marker)) {
                        node.removeAttribute(name);
                        actions.push(AttributeNameAction.bind(aMeta));
                    }
                    if (hasMarker(value, marker)) {
                        node.removeAttribute(name);
                        actions.push(AttributeValueAction.bind(aMeta));
                    }
                } else {
                    if (isLink(name)) {
                        if (dangerousLink(value)) {
                            node.removeAttribute(name);
                            console.warn(`XElement - attribute name "${name}" and value "${value}" not allowed`);
                        }
                    } else if (hasOn(name)) {
                        node.removeAttribute(name);
                        console.warn(`XElement - attribute name "${name}" not allowed`);
                    }
                }
            }
        } else {
            console.warn(`XElement - node type "${node.nodeType}" not handled`);
        }
    }
};
var bind_default = Bind;

// source/events.ts
var adoptedEvent = new Event('adopted');
var adoptingEvent = new Event('adopting');
var upgradedEvent = new Event('upgraded');
var upgradingEvent = new Event('upgrading');
var creatingEvent = new Event('creating');
var createdEvent = new Event('created');
var renderingEvent = new Event('rendering');
var renderedEvent = new Event('rendered');
var connectedEvent = new Event('connected');
var connectingEvent = new Event('connecting');
var attributedEvent = new Event('attributed');
var attributingEvent = new Event('attributing');
var disconnectedEvent = new Event('disconnected');
var disconnectingEvent = new Event('disconnecting');

// source/define.ts
var tick2 = () => Promise.resolve();
var setupInstance = function () {
    if (this.$internal.setup) {
        return;
    } else {
        this.$internal.setup = true;
    }
};
var createMethod = async function () {
    this.$internal.created = true;
    this.$internal.queued = true;
    this.$internal.started = true;
    this.dispatchEvent(renderingEvent);
    await this.$state?.(this.$internal.state);
    const template = await this.$render?.(this.$internal.state);
    if (template) {
        const fragment = template.template.content.cloneNode(true);
        this.$internal.marker = template.marker;
        this.$internal.expressions = template.expressions;
        bind_default(fragment, this.$internal.actions, this.$internal.marker);
        for (let index = 0; index < this.$internal.actions.length; index++) {
            const newExpression = template.expressions[index];
            try {
                this.$internal.actions[index](void 0, newExpression);
            } catch (error) {
                console.error(error);
            }
        }
        document.adoptNode(fragment);
        this.$internal.root.appendChild(fragment);
    }
    this.dispatchEvent(creatingEvent);
    await this.$created?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(createdEvent);
    this.dispatchEvent(connectingEvent);
    await this.$connected?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(connectedEvent);
    this.$internal.queued = false;
    this.$internal.started = false;
    this.$internal.restart = false;
    await this.$internal.update();
};
var updateMethod = async function () {
    if (this.$internal.queued && !this.$internal.started) {
        return this.$internal.task;
    }
    if (this.$internal.queued && this.$internal.started) {
        this.$internal.restart = true;
        return this.$internal.task;
    }
    this.$internal.queued = true;
    this.$internal.task = this.$internal.task.then(async () => {
        this.dispatchEvent(renderingEvent);
        const template = await this.$render?.(this.$internal.state);
        this.$internal.started = true;
        if (template) {
            for (let index = 0; index < this.$internal.actions.length; index++) {
                if (this.$internal.restart) {
                    await tick2();
                    index = -1;
                    this.$internal.restart = false;
                    continue;
                }
                const newExpression = template.expressions[index];
                const oldExpression = this.$internal.expressions[index];
                try {
                    this.$internal.actions[index](oldExpression, newExpression);
                } catch (error) {
                    console.error(error);
                }
                this.$internal.expressions[index] = template.expressions[index];
            }
        }
        this.$internal.queued = false;
        this.$internal.started = false;
        await this.$rendered?.(this.$internal.state)?.catch(console.error);

        this.dispatchEvent(renderedEvent);
    }).catch(console.error);
    return this.$internal.task;
};
var attributeChangedCallback = async function (name, oldValue, newValue) {
    setupInstance.call(this);
    this.dispatchEvent(attributingEvent);
    await this.$attributed?.(name, oldValue, newValue)?.catch(console.error);
    this.dispatchEvent(attributedEvent);
};
var adoptedCallback = async function () {
    setupInstance.call(this);
    this.dispatchEvent(adoptingEvent);
    await this.$adopted?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(adoptedEvent);
};
var connectedCallback = async function () {
    setupInstance.call(this);
    if (!this.$internal.created) {
        await this.$internal.create();
    } else {
        this.dispatchEvent(connectingEvent);
        await this.$connected?.(this.$internal.state)?.catch(console.error);
        this.dispatchEvent(connectedEvent);
    }
};
var disconnectedCallback = async function () {
    setupInstance.call(this);
    this.dispatchEvent(disconnectingEvent);
    await this.$disconnected?.(this.$internal.state)?.catch(console.error);
    this.dispatchEvent(disconnectedEvent);
};
var init2 = (target, tag2) => {
    const $tag = dash(tag2);
    Object.defineProperties(target, { $tag: { value: $tag } });
    Object.defineProperties(target.prototype, {
        $internal: {
            get() {
                const $shadow = target.$shadow;
                const value = {
                    setup: false,
                    queued: false,
                    created: false,
                    restart: false,
                    started: false,
                    marker: '',
                    actions: [],
                    expressions: [],
                    task: Promise.resolve(),
                    create: createMethod.bind(this),
                    update: updateMethod.bind(this),
                    state: {},
                    // state: context({}, updateMethod.bind(this)),
                    root: $shadow === 'open' || $shadow === 'closed' ? this.attachShadow({ mode: $shadow }) : this,
                };
                Object.defineProperty(this, '$internal', {
                    value,
                    writable: false,
                    enumerable: false,
                    configurable: false,
                });
                return value;
            },
        },
        // [create]: { value: createMethod },
        // [update]: { value: updateMethod },
        adoptedCallback: { value: adoptedCallback },
        connectedCallback: { value: connectedCallback },
        disconnectedCallback: { value: disconnectedCallback },
        attributeChangedCallback: { value: attributeChangedCallback },
    });
    const $extend = target.$extend;
    customElements.define($tag, target, { extends: $extend });
    return target;
};
var define = function (tag2) {
    return function (constructor, context) {
        if (context !== void 0) {
            return context.addInitializer(() => init2(constructor, tag2));
        } else {
            return init2(constructor, tag2);
        }
    };
};
var define_default = define;

// source/shadow.ts
var shadow_exports = {};
__export(shadow_exports, {
    default: () => shadow_default,
    shadow: () => shadow,
});
var init3 = (target, mode) => {
    Object.defineProperties(target, {
        $shadow: { value: mode ?? 'open' },
    });
    return target;
};
var shadow = function (mode) {
    return (constructor, context) => {
        if (context !== void 0) {
            return context.addInitializer(() => init3(constructor, mode));
        } else {
            return init3(constructor, mode);
        }
    };
};
var shadow_default = shadow;

// source/types.ts
var types_exports = {};
__export(types_exports, {
    Component: () => Component,
});
var Component = class extends HTMLElement {
};

// source/index.ts
var source_default = {
    Router: router_default,
    router: router_default,
    html,
    ...mount_exports,
    ...shadow_exports,
    ...define_exports,
    ...symbols_exports,
    ...types_exports,
};
var text = function (selector) {
    console.log(arguments);
    return function (target, nameOrContext) {
        console.log(arguments);
    };
};

// public/idea/index.ts
var XTest = class extends HTMLElement {
    constructor() {
        super(...arguments);
        this.count = 0;
        this.$state = (s) => {
            s.count = 0;
            setInterval(() => s.count++, 1e3);
        };
        this.$render = (s) =>
            html`
        <strong>${s.count}</strong>
        <strong id="count"></strong>
    `;
    }
};
__decorateClass(
    [
        text('#count'),
    ],
    XTest.prototype,
    'count',
    2,
);
XTest = __decorateClass([
    mount('body'),
    define('x-test'),
], XTest);
//# sourceMappingURL=index.js.map
