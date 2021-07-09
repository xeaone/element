import Load from './load';

type Option = {
    folder?: string;
    contain?: boolean;
    dynamic?: boolean;
    external?: string;
    target: string | Element;
    after?: (location: any) => Promise<any>;
    before?: (location: any) => Promise<any>;
};

const absolute = function (path: string) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};

export default new class Router {

    #target: Element;
    #data: object = {};
    #folder: string = '';
    #dynamic: boolean = true;
    #contain: boolean = false;
    #external: string | RegExp | Function;
    #after?: (location: any) => Promise<any>;
    #before?: (location: any) => Promise<any>;

    get hash () { return window.location.hash; }
    get host () { return window.location.host; }
    get hostname () { return window.location.hostname; }
    get href () { return window.location.href; }
    get origin () { return window.location.origin; }
    get pathname () { return window.location.pathname; }
    get port () { return window.location.port; }
    get protocol () { return window.location.protocol; }
    get search () { return window.location.search; }

    get query () {
        const queries = window.location.search.slice(1).split('&');
        const result = {};

        for (const query of queries) {
            let [ name, value ] = query.split('=');
            value = decodeURIComponent(value.replace(/\+/g, ' '));
            if (name in result) {
                if (typeof result[ name ] === 'object') {
                    result[ name ].push(value);
                } else {
                    result[ name ] = [ result[ name ], value ];
                }
            } else {
                result[ name ] = value;
            }
        }

        return result;
    }

    back () { window.history.back(); }
    forward () { window.history.forward(); }
    reload () { window.location.reload(); }
    redirect (href: string) { window.location.href = href; }

    async setup (option: Option) {

        if ('folder' in option) this.#folder = option.folder;
        if ('contain' in option) this.#contain = option.contain;
        if ('dynamic' in option) this.#dynamic = option.dynamic;
        if ('external' in option) this.#external = option.external;
        if ('before' in option) this.#before = option.before;
        if ('after' in option) this.#after = option.after;

        this.#target = option.target instanceof Element ? option.target : document.body.querySelector(option.target);

        if (this.#dynamic) {
            window.addEventListener('popstate', this.#state.bind(this), true);

            if (this.#contain) {
                this.#target.addEventListener('click', this.#click.bind(this), true);
            } else {
                window.document.addEventListener('click', this.#click.bind(this), true);
            }
        }

        return this.replace(window.location.href);
    }

    async assign (data: string) {
        return this.#go(data, { mode: 'push' });
    }

    async replace (data: string) {
        return this.#go(data, { mode: 'replace' });
    }

    #location (href: string = window.location.href) {
        const parser = document.createElement('a');
        parser.href = href;

        return {
            // path: '',
            // path: parser.pathname,
            href: parser.href,
            host: parser.host,
            port: parser.port,
            hash: parser.hash,
            search: parser.search,
            protocol: parser.protocol,
            hostname: parser.hostname,
            pathname: parser.pathname
            // pathname: parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname
        };

        // location.path = location.pathname + location.search + location.hash;

        // return location;
    }

    async #go (path: string, options: any = {}) {

        // if (options.query) {
        //     path += Query(options.query);
        // }

        const mode = options.mode || 'push';
        const location = this.#location(path);

        if (this.#before) await this.#before(location);

        if (!this.#dynamic) {
            return window.location[ mode === 'push' ? 'assign' : mode ](location.href);
        }

        window.history.replaceState({
            href: window.location.href,
            top: document.documentElement.scrollTop || document.body.scrollTop || 0
        }, '', window.location.href);

        window.history[ mode + 'State' ]({
            top: 0,
            href: location.href
        }, '', location.href);

        let element;
        if (location.pathname in this.#data) {
            element = this.#data[ location.pathname ];
        } else {
            const path = location.pathname === '/' ? '/index' : location.pathname;

            let load = path;
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

            const name = 'route' + path.replace(/\/+/g, '-');
            window.customElements.define(name, component);
            element = window.document.createElement(name);

            this.#data[ location.pathname ] = element;
        }

        const keywords = document.querySelector('meta[name="keywords"]');
        const description = document.querySelector('meta[name="description"]');

        if (element.title) window.document.title = element.title;
        if (element.keywords && keywords) keywords.setAttribute('content', element.keywords);
        if (element.description && description) description.setAttribute('content', element.description);

        while (this.#target.firstChild) {
            this.#target.removeChild(this.#target.firstChild);
        }

        this.#target.appendChild(element);

        if (this.#after) await this.#after(location);

        window.dispatchEvent(new CustomEvent('router', { detail: location }));
    }

    async #state (event) {
        await this.replace(event.state.href);
        window.scroll(event.state.top, 0);
    }

    async #click (event) {

        // ignore canceled events, modified clicks, and right clicks
        if (
            event.target.type ||
            event.button !== 0 ||
            event.defaultPrevented ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        ) return;

        // if shadow dom use
        let target = event.path ? event.path[ 0 ] : event.target;
        let parent = target.parentElement;

        if (this.#contain) {

            while (parent) {
                if (parent.nodeName === this.#target.nodeName) {
                    break;
                } else {
                    parent = parent.parentElement;
                }
            }

            if (parent.nodeName !== this.#target.nodeName) {
                return;
            }

        }

        while (target && 'A' !== target.nodeName) {
            target = target.parentElement;
        }

        if (!target || 'A' !== target.nodeName) {
            return;
        }

        if (target.hasAttribute('download') ||
            target.hasAttribute('external') ||
            target.hasAttribute('o-external') ||
            target.href.startsWith('tel:') ||
            target.href.startsWith('ftp:') ||
            target.href.startsWith('file:)') ||
            target.href.startsWith('mailto:') ||
            !target.href.startsWith(window.location.origin)
            // ||
            // (target.hash !== '' &&
            //     target.origin === window.location.origin &&
            //     target.pathname === window.location.pathname)
        ) return;

        // if external is true then default action
        if (this.#external &&
            (this.#external instanceof RegExp && this.#external.test(target.href) ||
                typeof this.#external === 'function' && this.#external(target.href) ||
                typeof this.#external === 'string' && this.#external === target.href)
        ) return;

        event.preventDefault();
        this.assign(target.href);
    }

};;

// function Query (data) {
//     data = data || window.location.search;

//     if (typeof data === 'string') {

//         const result = {};

//         if (data.indexOf('?') === 0) data = data.slice(1);
//         const queries = data.split('&');

//         for (let i = 0; i < queries.length; i++) {
//             const [ name, value ] = queries[i].split('=');
//             if (name !== undefined && value !== undefined) {
//                 if (name in result) {
//                     if (typeof result[name] === 'string') {
//                         result[name] = [ value ];
//                     } else {
//                         result[name].push(value);
//                     }
//                 } else {
//                     result[name] = value;
//                 }
//             }
//         }

//         return result;

//     } else {

//         const result = [];

//         for (const key in data) {
//             const value = data[key];
//             result.push(`${key}=${value}`);
//         }

//         return `?${result.join('&')}`;

//     }

// }
