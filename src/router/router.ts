import dash from './dash';

type OnAfter = (location: Location, element: Element) => Promise<void>;
type OnBefore = (location: Location, element: Element) => Promise<void>;

type Location = {
    href: string;
    host: string;
    port: string;
    hash: string;
    search: string;
    hostname: string;
    protocol: string;
    pathname: string;
};

type Option = {
    cache?: boolean;
    folder?: string;
    contain?: boolean;
    dynamic?: boolean;
    external?: string;
    target: Element;
    onAfter?: OnAfter;
    onBefore?: OnBefore;
};

const Listener = (target: Element, name: string) => {
    return new Promise((resolve) => {
        target.addEventListener(name, function handle() {
            target.removeEventListener(name, handle);
            resolve(null);
        });
    });
};

export default class XRouter extends HTMLElement {

    static define(name?: string, constructor?: typeof XRouter) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }

    static defined(name: string) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }

    #folder = '';
    #cache = true;
    #target: Element;
    #onAfter?: OnAfter;
    #onBefore?: OnBefore;
    #paths: Array<string> = [];
    #observer?: MutationObserver;
    #names: Map<string, string> = new Map();
    #elements: Map<string, Element> = new Map();
    #clickInstance: (event: MouseEvent) => void;
    #stateInstance: (event: PopStateEvent) => void;

    constructor(option: Option) {
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
        this.#stateInstance = function (event) { instance.#state(event); };
        this.#clickInstance = function (event) { instance.#click(event, this as any); };

        this.attachShadow({ mode: 'open' }).innerHTML = `<slot></slot>`;
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

    redirect(href: string) {
        window.location.href = href;
    }

    onAfter(onAfter: OnAfter) {
        this.#onAfter = onAfter;
        return this;
    }

    onBefore(onBefore: OnBefore) {
        this.#onBefore = onBefore;
        return this;
    }

    cache(cache: boolean) {
        this.#cache = cache;
        return this;
    }

    path(...path: Array<string>) {
        this.#paths.push(...path);
        return this;
    }

    paths(paths: Array<string>) {
        this.#paths = paths;
        return this;
    }

    target(target: Element) {
        this.#target = target;
        return this;
    }

    assign(data: string) {
        return this.#go(data, { mode: 'push' });
    }

    replace(data: string) {
        return this.#go(data, { mode: 'replace' });
    }

    #location(href: string = window.location.href) {
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
            // pathname: parser.pathname
            pathname: `${parser.origin}${parser.pathname.replace(/\/$/, '')}`.replace(document.baseURI.replace(/\/$/, ''), '') || '/'
        };
    }

    async #go(path: string, options: { mode: 'push' | 'replace'; }) {
        this.setAttribute('status', 'rendering');

        const mode = options?.mode || 'push';
        const location = this.#location(path);

        let element: any;
        if (this.#names.has(location.pathname)) {
            element = this.#cache ?
                this.#elements.get(location.pathname) :
                document.createElement(this.#names.get(location.pathname) as string);
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

        if (mode === 'push') globalThis.history.pushState({ top: 0, href: location.href }, '', location.href);
        if (mode === 'replace') globalThis.history.replaceState({ top: 0, href: location.href }, '', location.href);

        const keywords = document.head.querySelector('meta[name="keywords"]');
        const description = document.head.querySelector('meta[name="description"]');

        if (element.title) window.document.title = element.title;
        if (element.keywords && keywords) keywords.setAttribute('content', element.keywords);
        if (element.description && description) description.setAttribute('content', element.description);

        while (this.lastChild) this.removeChild(this.lastChild);
        this.appendChild(element);

        if (element.isPrepared === false) await Listener(element, 'prepared');

        this.setAttribute('status', 'rendered');
        if (this.#onAfter) await this.#onAfter(location, element);

    }

    async #state(event: PopStateEvent) {
        const { href, pathname } = this.#location(event?.state?.href || window.location.href);

        if (!href.startsWith(window.location.origin)) return;
        if (this.#paths.length && !this.#paths.includes(pathname)) return;

        await this.replace(href);
        globalThis.scroll(event?.state?.top || 0, 0);
    }

    async #click(event: MouseEvent, element: HTMLAnchorElement) {

        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey) return;

        if (element.hasAttribute('download') ||
            element.hasAttribute('external') ||
            element.hasAttribute('target') ||
            element.href.startsWith('tel:') ||
            element.href.startsWith('ftp:') ||
            element.href.startsWith('file:)') ||
            element.href.startsWith('mailto:') ||
            !element.href.startsWith(window.location.origin)) return;

        if (this.#paths.length && !this.#paths.includes(element.pathname)) return;

        event.preventDefault();
        if (element.href === window.location.href) return;

        await this.assign(element.href);
        globalThis.scroll(0, 0);
    }

    async connectedCallback() {
        await this.replace(window.location.href);

        this.#target.querySelectorAll('a').forEach(node => node.addEventListener('click', this.#clickInstance, true));

        this.#observer = new MutationObserver(mutations => mutations.forEach(mutation => {

            const added = mutation.addedNodes as NodeListOf<HTMLElement>;
            for (const node of added) {
                if (node.nodeName === 'A') node.addEventListener('click', this.#clickInstance, true);
                if (node.hasChildNodes() || node?.shadowRoot?.hasChildNodes()) {
                    node.querySelectorAll('a').forEach(n => n.addEventListener('click', this.#clickInstance, true));
                    node?.shadowRoot?.querySelectorAll('a').forEach(n => n.addEventListener('click', this.#clickInstance, true));
                }
            }

            const removed = mutation.removedNodes as NodeListOf<HTMLElement>;
            for (const node of removed) {
                if (node.nodeName === 'A') node.removeEventListener('click', this.#clickInstance, true);
                if (node.hasChildNodes() || node?.shadowRoot?.hasChildNodes()) {
                    node.querySelectorAll('a').forEach(n => n.removeEventListener('click', this.#clickInstance, true));
                    node?.shadowRoot?.querySelectorAll('a').forEach(n => n.removeEventListener('click', this.#clickInstance, true));
                }
            }

        }));

        this.#observer.observe(this.#target, { childList: true, subtree: true });

        globalThis.addEventListener('popstate', this.#stateInstance, true);
    }

}
