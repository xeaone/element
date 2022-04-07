import Load from './load.ts';
import dash from './dash.ts';

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
    after?: (location: Location, target: Element) => Promise<void>;
    before?: (location: Location, target: Element) => Promise<void>;
};

const absolute = function (path: string) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};

export default class XRouter extends HTMLElement {

    static define (name?: string, constructor?: typeof XRouter) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }

    static defined (name: string) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }

    #folder = '';

    #cache = false;
    // #cache = true;
    #dynamic = true;

    #target: Element;
    #paths: Array<string> = [];
    #observer: MutationObserver;
    #data: Record<string, any> = {};
    #external?: string | RegExp | ((href: string) => void);
    #clickInstance: (event: MouseEvent) => Promise<void>;
    #stateInstance: (event: PopStateEvent) => Promise<void>;
    #after?: (location: Location, target: Element) => Promise<void>;
    #before?: (location: Location, target: Element) => Promise<void>;

    get hash () { return window.location.hash; }
    get host () { return window.location.host; }
    get hostname () { return window.location.hostname; }
    get href () { return window.location.href; }
    get origin () { return window.location.origin; }
    get pathname () { return window.location.pathname; }
    get port () { return window.location.port; }
    get protocol () { return window.location.protocol; }
    get search () { return window.location.search; }

    // get query () {
    //     const result = {};
    //     const search = window.location.search;

    //     if (!search) return result;

    //     const queries = search.slice(1).split('&');
    //     for (const query of queries) {
    //         let [ name, value ] = query.split('=');
    //         name = decodeURIComponent(name.replace(/\+/g, ' '));
    //         value = decodeURIComponent(value.replace(/\+/g, ' '));
    //         if (name in result) {
    //             if (typeof result[ name ] === 'object') {
    //                 result[ name ].push(value);
    //             } else {
    //                 result[ name ] = [ result[ name ], value ];
    //             }
    //         } else {
    //             result[ name ] = value;
    //         }
    //     }

    //     return result;
    // }

    // set query (search) { }

    back () { window.history.back(); }
    forward () { window.history.forward(); }
    reload () { window.location.reload(); }
    redirect (href: string) { window.location.href = href; }

    constructor (option: Option) {
        super();

        this.#target = option?.target ?? this;

        // if ('folder' in option) this.#folder = option.folder;
        // if ('contain' in option) this.#contain = option.contain;
        // if ('dynamic' in option) this.#dynamic = option.dynamic;
        // if ('external' in option) this.#external = option.external;
        // if ('before' in option) this.#before = option.before;
        // if ('after' in option) this.#after = option.after;
        // if ('cache' in option) this.#cache = option.cache;

        // if ('beforeConnected' in option) this.#beforeConnected = option.beforeConnected;
        // if ('afterConnected' in option) this.#afterConnected = option.afterConnected;

        // this.#target = option.target instanceof Element ? option.target : document.body.querySelector(option.target);

        // if (this.#dynamic) {
        //     globalThis.addEventListener('popstate', this.#state.bind(this), true);

        //     if (this.#contain) {
        //         this.#target.addEventListener('click', this.#click.bind(this), true);
        //     } else {
        //         window.document.addEventListener('click', this.#click.bind(this), true);
        //     }
        // }

        this.#stateInstance = this.#state.bind(this);
        this.#clickInstance = this.#click.bind(this);
        this.attachShadow({ mode: 'open' }).innerHTML = `
            <slot name="head"></slot>
            <slot name="body"></slot>
            <slot></slot>
            <slot name="foot"></slot>
        `;

        this.#observer = new MutationObserver(mutations => mutations.forEach(mutation => {
            console.log(mutation);

            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'A') {
                    console.log('added', node);
                    node.addEventListener('click', this.#clickInstance as any, true);
                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeName === 'A') {
                    console.log('removed', node);
                    node.removeEventListener('click', this.#clickInstance as any, true);
                }
            }
        }));

        // const slots = (this.shadowRoot as ShadowRoot).querySelectorAll('slot');
        // slots.forEach(slot => slot.addEventListener('slotchange', function (event) {
        //     (event.target as any).assignedNodes()
        // }));

        // this.addEventListener('click', this.#click.bind(this), true);
        // globalThis.addEventListener('popstate', this.#state.bind(this), true);

        // return this.replace(window.location.href);
        this.#paths = this.getAttribute('paths')?.split(/\s*,\s*/) ?? [];
    }

    path (path: string) {
        this.#paths.push(path);
        return this;
    }

    target (target: Element) {
        this.#target = target;
        return this;
    }

    assign (data: string) {
        return this.#go(data, { mode: 'push' });
    }

    replace (data: string) {
        return this.#go(data, { mode: 'replace' });
    }

    #location (href: string = window.location.href) {
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
            pathname: parser.pathname
        };
    }

    async #go (path: string, options: any = {}) {

        // if (options.query) {
        //     path += Query(options.query);
        // }

        const mode = options.mode || 'push';
        const location = this.#location(path);

        let element;
        // if (location.pathname in this.#data) {
        //     const route = this.#data[ location.pathname ];
        //     element = this.#cache ? route.element : document.createElement(route.name);
        // } else {
        const p = location.pathname.endsWith('/') ? `${location.pathname}root` : location.pathname;
        const base = document.baseURI.replace(window.location.origin, '');

        let load = p.startsWith(base) ? p.replace(base, '') : p;
        if (load.slice(0, 2) === './') load = load.slice(2);
        if (load.slice(0, 1) !== '/') load = '/' + load;
        if (load.slice(0, 1) === '/') load = load.slice(1);

        load = `${this.#folder}/${load}.js`.replace(/\/+/g, '/');
        load = absolute(load);

        let component;
        try {
            component = (await Load(load)).default;
        } catch (error) {
            if (error.message === `Failed to fetch dynamically imported module: ${window.location.origin}${load}`) {
                component = (await Load(absolute(`${this.#folder}/all.js`))).default;
            } else {
                throw error;
            }
        }

        const name = 'x-router' + p.replace(/\/+/g, '-');
        // customElements.define(name, component);
        console.log(this.#data, location.pathname);

        if (!this.#data[ location.pathname ]) {
            customElements.define(name, component);
        }

        element = document.createElement(name) as any;
        this.#data[ location.pathname ] = name;
        console.log(this.#data, location.pathname);
        // this.#data[ location.pathname ] = { element: this.#cache ? element : null, name };
        // }

        if (this.#before) await this.#before(location, element);

        if (!this.#dynamic) {
            if (mode === 'push') return globalThis.location.assign(location.href);
            if (mode === 'replace') return globalThis.location.replace(location.href);
        }

        globalThis.history.replaceState({
            href: window.location.href,
            top: document.documentElement.scrollTop || document.body.scrollTop || 0
        }, '', window.location.href);

        if (mode === 'push') globalThis.history.pushState({ top: 0, href: location.href }, '', location.href);
        else if (mode === 'replace') globalThis.history.replaceState({ top: 0, href: location.href }, '', location.href);

        const keywords = document.querySelector('meta[name="keywords"]');
        const description = document.querySelector('meta[name="description"]');

        if (element.title) window.document.title = element.title;
        if (element.keywords && keywords) keywords.setAttribute('content', element.keywords);
        if (element.description && description) description.setAttribute('content', element.description);

        // while (this.firstChild) this.removeChild(this.firstChild);

        const nodes: any = this.childNodes;
        for (const node of nodes) {
            if (node?.attributes?.slot?.value === 'body') {
                while (node.firstChild) node.removeChild(node.firstChild);
            } else if (node?.attributes?.slot?.value === 'head' || node?.attributes?.slot?.value === 'foot') {
                continue;
            } else {
                this.removeChild(node);
            }
        }

        if (this.#after) {
            element.removeEventListener('afterconnected', this.#data[ location.pathname ].after);
            const after = this.#after.bind(this.#after, location, element);
            this.#data[ location.pathname ].after = after;
            element.addEventListener('afterconnected', after);
        }

        const body = this.querySelector('[slot="body"]');
        if (body) {
            body.appendChild(element);
        } else {
            this.appendChild(element);
        }

        globalThis.dispatchEvent(new CustomEvent('xrouter', { detail: location }));
    }

    async #state (event: PopStateEvent) {
        const { href, pathname } = this.#location(event?.state?.href || window.location.href);
        if (this.#paths[ 0 ] !== '*' && !this.#paths.includes(pathname)) return;
        await this.replace(href);
        globalThis.scroll(event?.state?.top || 0, 0);
    }

    async #click (event: MouseEvent) {

        // ignore canceled events, modified clicks, and right clicks
        if (
            event.button !== 0 ||
            event.defaultPrevented ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        ) return;

        const target = (event.target as HTMLAnchorElement);

        // // if shadow dom use
        // let target = event.path ? event.path[ 0 ] : event.target;
        // let parent = target.parentElement;

        // if (this.#contain) {

        //     while (parent) {
        //         if (parent.nodeName === this.#target.nodeName) {
        //             break;
        //         } else {
        //             parent = parent.parentElement;
        //         }
        //     }

        //     if (parent.nodeName !== this.#target.nodeName) {
        //         return;
        //     }

        // }

        // while (target && 'A' !== target.nodeName) {
        //     target = target.parentElement;
        // }

        // if (!target || 'A' !== target.nodeName) {
        //     return;
        // }

        if (target.hasAttribute('download') ||
            target.hasAttribute('external') ||
            target.hasAttribute('target') ||
            target.href.startsWith('tel:') ||
            target.href.startsWith('ftp:') ||
            target.href.startsWith('file:)') ||
            target.href.startsWith('mailto:') ||
            !target.href.startsWith(window.location.origin)
        ) return;

        if (this.#external &&
            (this.#external instanceof RegExp && this.#external.test(target.href) ||
                typeof this.#external === 'function' && this.#external(target.href) ||
                typeof this.#external === 'string' && this.#external === target.href)
        ) return;

        if (this.#paths[ 0 ] !== '*' && !this.#paths.includes(target.pathname)) return;

        event.preventDefault();
        await this.assign(target.href);
    }

    async connectedCallback () {
        await this.replace(window.location.href);

        const nodes = this.#target.querySelectorAll('a');
        for (const node of nodes) {
            node.addEventListener('click', this.#clickInstance, true);
        }

        // this.#observer.observe(this.#target, { childList: true });
        this.#observer.observe(this.#target, { childList: true });
        globalThis.addEventListener('popstate', this.#stateInstance, true);
    }

}
