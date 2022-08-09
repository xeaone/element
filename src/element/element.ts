import { dataDelete, dataEvent, dataGet, dataSet, dataHas } from './data';
import StandardBinder from './standard';
import CheckedBinder from './checked';
import InheritBinder from './inherit';
import ValueBinder from './value';
import EachBinder from './each';
import HtmlBinder from './html';
import TextBinder from './text';
import Binder from './binder';
import OnBinder from './on';
import Dash from './dash';

const navigators = new Map();

const transition = async (options: any) => {
    if (options.cache && options.instance) return options.target.replaceChildren(options.instance);

    if (options.navigating) return;
    else options.navigating = true;

    options.construct = options.construct ?? (await import(options.file)).default;
    if (!(options.construct?.prototype instanceof XElement)) throw new Error('XElement - navigation construct not valid');

    options.name = options.name ?? Dash(options.construct.name);
    if (!/\w+-\w+/.test(options.name)) throw new Error('XElement - navigation name not valid');

    if (!customElements.get(options.name)) customElements.define(options.name, options.construct);

    options.instance = document.createElement(options.name);
    options.target.replaceChildren(options.instance);
    options.navigating = false;
};

const navigate = (event?: any) => {
    if (event && (!event?.canTransition || !event?.canIntercept)) return;
    const destination = new URL(event?.destination.url ?? location.href);
    const base = document.querySelector('base')?.href.replace(/\/+$/, '') ?? location.origin;
    const pathname = destination.href.replace(base, '');
    const options = navigators.get(pathname) ?? navigators.get('/*');

    if (!options) return;

    options.target = options.target ?? document.querySelector(options.query);
    if (!options.target) throw new Error('XElement - navigation target not found');

    if (options.instance === options.target.lastElementChild) return event?.preventDefault();

    return event ? event?.transitionWhile(transition(options)) : transition(options);
};

export default class XElement extends HTMLElement {

    static observedProperties?: Array<string>;

    static define (name?: string, constructor?: typeof XElement) {
        constructor = constructor ?? this;
        name = name ?? Dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? Dash(this.name);
        return customElements.whenDefined(name);
    }

    static navigation (path: string, file: string, options: any) {
        if (!path) throw new Error('XElement - navigation path required');
        if (!file) throw new Error('XElement - navigation file required');
        options = options ?? {};
        options.path = path;
        options.file = file;
        options.cache = options.cache ?? true;
        options.query = options.query ?? 'main';
        navigators.set(path, options);
        navigate();
        (window as any).navigation.addEventListener('navigate', navigate);
    }

    get isPrepared () { return this.#prepared; }

    #data = {};
    #syntaxEnd = '}}';
    #syntaxStart = '{{';
    #syntaxLength = 2;
    #prepared = false;
    #preparing = false;
    #syntaxMatch = new RegExp('{{.*?}}');
    #mutator = new MutationObserver(this.#mutation.bind(this));
    #binders: Map<string | Node | Element | undefined, Set<Binder>> = new Map();

    #adoptedEvent = new Event('adopted');
    #adoptingEvent = new Event('adopting');
    #preparedEvent = new Event('prepared');
    #preparingEvent = new Event('preparing');
    #connectedEvent = new Event('connected');
    #connectingEvent = new Event('connecting');
    #attributedEvent = new Event('attributed');
    #attributingEvent = new Event('attributing');
    #disconnectedEvent = new Event('disconnected');
    #disconnectingEvent = new Event('disconnecting');

    constructor () {
        super();
        if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
        this.#mutator.observe(this, { childList: true });
        this.#mutator.observe((this.shadowRoot as ShadowRoot), { childList: true });
    }

    prepare () {
        if (this.#prepared || this.#preparing) return;

        this.#preparing = true;
        this.dispatchEvent(this.#preparingEvent);

        const data: Record<string, any> = {};
        const prototype = Object.getPrototypeOf(this);
        const properties = (this.constructor as any).observedProperties;
        const descriptors: any = { ...Object.getOwnPropertyDescriptors(this), ...Object.getOwnPropertyDescriptors(prototype) };

        for (const property in descriptors) {
            if (properties && !properties?.includes(property) ||
                'attributeChangedCallback' === property ||
                'disconnectedCallback' === property ||
                'connectedCallback' === property ||
                'adoptedCallback' === property ||
                'constructor' === property) continue;

            const descriptor = descriptors[ property ];
            const { enumerable, configurable } = descriptor;
            if (!configurable) continue;

            if ('set' in descriptor) descriptor.set = descriptor.set?.bind(this);
            if ('get' in descriptor) descriptor.get = descriptor.get?.bind(this);
            if (typeof descriptor.value === 'function') descriptor.value = descriptor.value?.bind?.(this);

            const get = () => (this as any).#data[ property ];
            const set = (value: any) => (this as any).#data[ property ] = value;

            Object.defineProperty(data, property, descriptor);
            Object.defineProperty(this, property, { get, set, enumerable, configurable: false });
        }

        this.#data = new Proxy(data, {
            has: dataHas.bind(null),
            get: dataGet.bind(null, dataEvent.bind(null, this.#binders), ''),
            set: dataSet.bind(null, dataEvent.bind(null, this.#binders), ''),
            deleteProperty: dataDelete.bind(null, dataEvent.bind(null, this.#binders), '')
        });

        let shadowNode = this.shadowRoot?.firstChild;
        while (shadowNode) {
            const node = shadowNode;
            shadowNode = node.nextSibling;
            this.register(node, this.#data);
        }

        let innerNode = this.firstChild;
        while (innerNode) {
            const node = innerNode;
            innerNode = node.nextSibling;
            this.register(node, this.#data);
        }

        this.#prepared = true;
        this.dispatchEvent(this.#preparedEvent);
    }

    #mutation (mutations: Array<MutationRecord>) {
        if (!this.#prepared) return this.prepare();
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                this.register(node, this.#data);
            }
            for (const node of mutation.removedNodes) {
                this.release(node);
            }
        }
    }

    #remove (node: Node) {
        const binders = this.#binders.get(node);
        if (!binders) return;

        for (const binder of binders) {
            for (const reference of binder.references) {
                this.#binders.get(reference)?.delete(binder);
                if (!this.#binders.get(reference)?.size) this.#binders.delete(reference);
            }
        }

        this.#binders.delete(node);
    }

    #add (node: Node, context: Record<string, any>, instance?: Record<string, any>, rewrites?: Array<Array<string>>) {

        let binder;
        if (node.nodeName === '#text') binder = new TextBinder(node, this, context, instance, rewrites);
        else if (node.nodeName === 'html') binder = new HtmlBinder(node, this, context, instance, rewrites);
        else if (node.nodeName === 'each') binder = new EachBinder(node, this, context, instance, rewrites);
        else if (node.nodeName === 'value') binder = new ValueBinder(node, this, context, instance, rewrites);
        else if (node.nodeName === 'inherit') binder = new InheritBinder(node, this, context, instance, rewrites);
        else if (node.nodeName === 'checked') binder = new CheckedBinder(node, this, context, instance, rewrites);
        else if (node.nodeName.startsWith('on')) binder = new OnBinder(node, this, context, instance, rewrites);
        else binder = new StandardBinder(node, this, context, instance, rewrites);

        for (let reference of binder.references) {

            if (rewrites) {
                for (const [ name, value ] of rewrites) {
                    if (reference === name) reference = value;
                    else if (reference.startsWith(name + '.')) reference = value + reference.slice(name.length);
                }
            }

            if (!this.#binders.get(reference)?.add(binder)?.size) {
                this.#binders.set(reference, new Set([ binder ]));
            }

        }

        if (!this.#binders.get(binder.owner ?? binder.node)?.add(binder)?.size) {
            this.#binders.set(binder.owner ?? binder.node, new Set([ binder ]));
        }

        binder.render();
    }

    release (node: Node) {

        if (node.nodeType === Node.TEXT_NODE) {
            this.#remove(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.#remove(node);

            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                this.#remove(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.release(child);
                child = child.nextSibling;
            }

        }
    }

    register (node: Node, context: Record<string, any>, instance?: Record<string, any>, rewrites?: Array<Array<string>>) {
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            let child = node.firstChild, register;
            while (child) {
                register = child;
                child = node.nextSibling;
                this.register(register, context, instance, rewrites);
            }
        } else if (node.nodeType === node.TEXT_NODE) {

            const start = node.nodeValue?.indexOf(this.#syntaxStart) ?? -1;
            if (start === -1) return;
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue?.indexOf(this.#syntaxEnd) ?? -1;
            if (end === -1) return;

            if (end + this.#syntaxLength !== node.nodeValue?.length) {
                const split = (node as Text).splitText(end + this.#syntaxLength);
                this.#add(node, context, instance, rewrites);
                this.register(split, context, instance, rewrites);
            } else {
                this.#add(node, context, instance, rewrites);
            }

        } else if (node.nodeType === node.ELEMENT_NODE) {

            const inherit = (node as Element).attributes.getNamedItem('inherit');
            if (inherit) this.#add(inherit, context, instance, rewrites);

            const each = (node as Element).attributes.getNamedItem('each');
            if (each) this.#add(each, context, instance, rewrites);

            if (!each && !inherit) {
                let child = node.firstChild, register;
                while (child) {
                    register = child;
                    child = child.nextSibling;
                    this.register(register, context, instance, rewrites);
                }
            }

            const attributes = [ ...(node as Element).attributes ];
            for (const attribute of attributes) {
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.#syntaxMatch.test(attribute.value)) {
                    this.#add(attribute, context, instance, rewrites);
                }
            }

        }
    }

    adoptedCallback () {
        this.dispatchEvent(this.#adoptingEvent);
        (this as any).adopted?.();
        this.dispatchEvent(this.#adoptedEvent);
    }

    connectedCallback () {
        this.dispatchEvent(this.#connectingEvent);
        (this as any).connected?.();
        this.dispatchEvent(this.#connectedEvent);
    }

    disconnectedCallback () {
        this.dispatchEvent(this.#disconnectingEvent);
        (this as any).disconnected?.();
        this.dispatchEvent(this.#disconnectedEvent);
    }

    attributeChangedCallback (name: string, from: string, to: string) {
        this.dispatchEvent(this.#attributingEvent);
        (this as any).attributed?.(name, from, to);
        this.dispatchEvent(this.#attributedEvent);
    }

}
