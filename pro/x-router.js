// Name: X Element
// Version: 7.2.1
// License: MPL-2.0
// Author: Alexander Elias
// Email: alex.steven.elias@gmail.com
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
const Listener = (target, name)=>{
    return new Promise((resolve)=>{
        target.addEventListener(name, function handle() {
            target.removeEventListener(name, handle);
            resolve(null);
        });
    });
};
class XRouter extends HTMLElement {
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }
    #folder = '';
    #cache = true;
    #target;
    #onAfter;
    #onBefore;
    #paths = [];
    #observer;
    #names = new Map();
    #elements = new Map();
    #clickInstance;
    #stateInstance;
    constructor(option){
        super();
        this.#target = option?.target ?? this;
        this.#cache = option?.cache ?? this.#cache;
        this.#folder = option?.folder ?? this.#folder;
        this.#onAfter = option?.onAfter ?? this.#onAfter;
        this.#onBefore = option?.onBefore ?? this.#onBefore;
        const instance = this;
        const paths = this.getAttribute('paths');
        const cache = this.getAttribute('cache');
        const folder = this.getAttribute('folder');
        this.#folder = folder ?? this.#folder;
        this.#paths = paths?.split(/\s*,\s*/) ?? this.#paths;
        this.#cache = cache === 'true' ? true : cache === 'false' ? false : this.#cache;
        this.#stateInstance = function(event) {
            instance.#state(event);
        };
        this.#clickInstance = function(event) {
            instance.#click(event, this);
        };
        this.attachShadow({
            mode: 'open'
        }).innerHTML = `
            <slot name="head"></slot>
            <slot name="body"></slot>
            <slot></slot>
            <slot name="foot"></slot>
        `;
    }
    back() {
        window.history.back();
    }
    forward() {
        window.history.forward();
    }
    reload() {
        window.location.reload();
    }
    redirect(href) {
        window.location.href = href;
    }
    onAfter(onAfter) {
        this.#onAfter = onAfter;
        return this;
    }
    onBefore(onBefore) {
        this.#onBefore = onBefore;
        return this;
    }
    cache(cache) {
        this.#cache = cache;
        return this;
    }
    path(...path) {
        this.#paths.push(...path);
        return this;
    }
    paths(paths) {
        this.#paths = paths;
        return this;
    }
    target(target) {
        this.#target = target;
        return this;
    }
    assign(data) {
        return this.#go(data, {
            mode: 'push'
        });
    }
    replace(data) {
        return this.#go(data, {
            mode: 'replace'
        });
    }
     #location(href = window.location.href) {
        const parser = document.createElement('a');
        parser.href = href;
        return {
            href: parser.href,
            host: parser.host,
            port: parser.port,
            hash: parser.hash,
            search: parser.search,
            protocol: parser.protocol,
            hostname: parser.hostname,
            pathname: `${parser.origin}${parser.pathname.replace(/\/$/, '')}`.replace(document.baseURI.replace(/\/$/, ''), '') || '/'
        };
    }
    async #go(path, options) {
        this.setAttribute('status', 'rendering');
        const mode = options?.mode || 'push';
        const location = this.#location(path);
        let element;
        if (this.#names.has(location.pathname)) {
            element = this.#cache ? this.#elements.get(location.pathname) : document.createElement(this.#names.get(location.pathname));
        } else {
            const file = location.pathname.endsWith('/') ? `${location.pathname}root` : location.pathname;
            const name = 'x-router' + file.replace(/\/+/g, '-');
            const base = window.document.baseURI;
            const load = `${base}/${this.#folder}/${file}.js`.replace(/\/+/g, '/');
            let component;
            try {
                component = (await import(load)).default;
            } catch (error) {
                if (error.message.startsWith('Failed to fetch dynamically imported module')) {
                    component = (await import(`${base}/${this.#folder}/all.js`.replace(/\/+/, '/'))).default;
                } else {
                    throw error;
                }
            }
            customElements.define(name, component);
            element = document.createElement(name);
            this.#names.set(location.pathname, name);
            if (this.#cache) this.#elements.set(location.pathname, element);
        }
        if (this.#onBefore) await this.#onBefore(location, element);
        globalThis.history.replaceState({
            href: window.location.href,
            top: window.document.body.scrollTop || 0
        }, '', window.location.href);
        if (mode === 'push') globalThis.history.pushState({
            top: 0,
            href: location.href
        }, '', location.href);
        if (mode === 'replace') globalThis.history.replaceState({
            top: 0,
            href: location.href
        }, '', location.href);
        const keywords = document.head.querySelector('meta[name="keywords"]');
        const description = document.head.querySelector('meta[name="description"]');
        if (element.title) window.document.title = element.title;
        if (element.keywords && keywords) keywords.setAttribute('content', element.keywords);
        if (element.description && description) description.setAttribute('content', element.description);
        const nodes = this.childNodes;
        for (const node of nodes){
            const slot = node?.attributes?.getNamedItem('slot')?.value;
            if (slot === 'body') {
                while(node.firstChild)node.removeChild(node.firstChild);
            } else if (slot === 'head' || slot === 'foot') {
                continue;
            } else {
                this.removeChild(node);
            }
        }
        const body = this.querySelector('[slot="body"]');
        if (body) {
            body.appendChild(element);
        } else {
            this.appendChild(element);
        }
        if (element.isPrepared === false) await Listener(element, 'prepared');
        this.setAttribute('status', 'rendered');
        if (this.#onAfter) await this.#onAfter(location, element);
    }
    async #state(event) {
        const { href: href1 , pathname  } = this.#location(event?.state?.href || window.location.href);
        if (!href1.startsWith(window.location.origin)) return;
        if (this.#paths.length && !this.#paths.includes(pathname)) return;
        await this.replace(href1);
        globalThis.scroll(event?.state?.top || 0, 0);
    }
    async #click(event1, element1) {
        if (event1.defaultPrevented || event1.button !== 0 || event1.altKey || event1.ctrlKey || event1.metaKey || event1.shiftKey) return;
        if (element1.hasAttribute('download') || element1.hasAttribute('external') || element1.hasAttribute('target') || element1.href.startsWith('tel:') || element1.href.startsWith('ftp:') || element1.href.startsWith('file:)') || element1.href.startsWith('mailto:') || !element1.href.startsWith(window.location.origin)) return;
        if (this.#paths.length && !this.#paths.includes(element1.pathname)) return;
        event1.preventDefault();
        if (element1.href === window.location.href) return;
        await this.assign(element1.href);
        globalThis.scroll(0, 0);
    }
    async connectedCallback() {
        await this.replace(window.location.href);
        this.#target.querySelectorAll('a').forEach((node)=>node.addEventListener('click', this.#clickInstance, true));
        this.#observer = new MutationObserver((mutations)=>mutations.forEach((mutation)=>{
                const added = mutation.addedNodes;
                for (const node of added){
                    if (node.nodeName === 'A') node.addEventListener('click', this.#clickInstance, true);
                    if (node.hasChildNodes() || node?.shadowRoot?.hasChildNodes()) {
                        node.querySelectorAll('a').forEach((n)=>n.addEventListener('click', this.#clickInstance, true));
                        node?.shadowRoot?.querySelectorAll('a').forEach((n)=>n.addEventListener('click', this.#clickInstance, true));
                    }
                }
                const removed = mutation.removedNodes;
                for (const node1 of removed){
                    if (node1.nodeName === 'A') node1.removeEventListener('click', this.#clickInstance, true);
                    if (node1.hasChildNodes() || node1?.shadowRoot?.hasChildNodes()) {
                        node1.querySelectorAll('a').forEach((n)=>n.removeEventListener('click', this.#clickInstance, true));
                        node1?.shadowRoot?.querySelectorAll('a').forEach((n)=>n.removeEventListener('click', this.#clickInstance, true));
                    }
                }
            }));
        this.#observer.observe(this.#target, {
            childList: true,
            subtree: true
        });
        globalThis.addEventListener('popstate', this.#stateInstance, true);
    }
}
export { XRouter as default };