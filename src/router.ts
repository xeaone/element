import Location from './location';
import Events from './events';
import Define from './define';
import Query from './query';
import Load from './load';

import basename from './path/basename';
// import normalize from './path/normalize';

const self = {};
const data = [];

type Route = {
    name : string
    path : string
    load : string
}

type Option = {
    folder?: string;
    routes?: Route[];
    contain?: boolean;
    external?: string;
    target?: string | Element;
    after?: (location:any) => void;
    before?: (location:any) => void;
    mode?: 'push' | 'replace' | 'href';
}

const absolute = function (path) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};

export default new class Router {

    data: Route[] = [];

    #folder: string;
    #contain: boolean;
    #target: Element;
    #after: (location:any) => void;
    #before: (location:any) => void;
    #external: string | RegExp | Function;
    #mode: 'push' | 'replace' | 'href' = 'push';

    async setup (option : Option = {}) {

        this.#after = option.after;
        this.#before = option.before;
        this.#external = option.external;
        this.#mode = option.mode ?? 'push';
        this.#contain = option.contain ?? false;
        this.#folder = option.folder ?? './routes';
        this.#target =  option.target instanceof Element ? option.target : document.body.querySelector(option.target || 'main'); 

        if (this.#mode !== 'href') {
            window.addEventListener('popstate', this.state.bind(this), true);
            window.document.addEventListener('click', this.click.bind(this), true);
        }

        await this.add(option.routes);
        await this.route(window.location.href, { mode: 'replace' });
    };

    compare (routePath, userPath) {
        const userParts = absolute(userPath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');
        const routeParts = absolute(routePath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');

        console.log(routePath, routeParts);
        console.log(userPath, userParts);

        for (let i = 0, l = userParts.length; i < l; i++) {
            if (routeParts[i] === 'any') return true;
            if (routeParts[i] !== userParts[i]) return false;
        }

        return true;
    };

    scroll (x, y) {
        window.scroll(x, y);
    };

    async back () {
        window.history.back();
    };

    async forward () {
        window.history.forward();
    };

    async redirect (path) {
        window.location.href = path;
    };

    async add (data : string | Array<string|Route> | Route) {
        if (!data) {
            throw new Error('Oxe.router.add - options required');
            // return;
        } else if (typeof data === 'string') {
            let load = data;
            let path = data;
            const name = `r-${data.replace('/', '-')}`;;

            if (path.slice(-3) === '') path = path.slice(0, -3);
            if (path.slice(-5) === 'index') path = path.slice(0, -5);
            if (path.slice(-6) === 'index/') path = path.slice(0, -6);
            if (path.slice(0, 2) === './') path = path.slice(2);
            if (path.slice(0, 1) !== '/') path = '/' + path;

            if (load.slice(-3) !== '') load = load + '';
            if (load.slice(0, 2) === './') load = load.slice(2);
            if (load.slice(0, 1) !== '/') load = '/' + load;

            if (load.slice(0, 1) === '/') load = load.slice(1);
            if (this.#folder.slice(-1) === '/') this.#folder = this.#folder.slice(0, -1);

            load = this.#folder + '/' + load + '.js';
            load = absolute(load);

            this.add({ path, name, load });
        } else if (data instanceof Array) {
            for (let i = 0; i < data.length; i++) {
                await this.add(data[i]);
            }
        } else {

            if (!data.name) throw new Error('Oxe.router.add - name required');
            if (!data.path) throw new Error('Oxe.router.add - path required');
            if (!data.load) throw new Error('Oxe.router.add - load required');

            // if (!data.name && !data.load && !data.component) {
            //     throw new Error('Oxe.router.add - route requires name and load property');
            // }

            this.data.push(data);
        }
    };

    async load (route) {

        if (route.load && !route.component) {
            const load = await Load(route.load);
            route.component = load.default;
        }

        // if (route.load) {
        //     const load = await Load(route.load);
        //     route = { ...load.default, ...route };
        // }

        // if (typeof route.component === 'string') {
        //     route.load = route.component;
        //     const load = await Load(route.load);
        //     route.component = load.default;
        // }

        return route;
    };

    async remove (path) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data.splice(i, 1);
            }
        }
    };

    async get (path) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data[i] = await this.load(this.data[i]);
                return this.data[i];
            }
        }
    };

    async filter (path) {
        const result = [];

        for (let i = 0; i < this.data.length; i++) {
            if (this.compare(this.data[i].path, path)) {
                this.data[i] = await this.load(this.data[i]);
                result.push(this.data[i]);
            }
        }

        return result;
    };

    async find (path) {
        // for (let i = 0; i < this.data.length; i++) {
        //     if (this.data[i].path === path) {
        //     // if (this.compare(this.data[i].path, path)) {
        //         this.data[i] = await this.load(this.data[i]);
        //         return this.data[i];
        //     }
        // }

        // let name;
        // if (path === '/') name = 'r-index';
        // else if (path.endsWith('/')) name = `r-${basename(path)}-index`;

        const route = this.data.find(route => this.compare(route.path, path));
            // this.data.find(route => route.path === path) ||
            // this.data.find(route => route.path === '/any');
            console.log(route);
            

        if (!route) throw new Error(`Oxe.router.route - not found ${path}`);

        const load = await this.load(route);
        console.log(load);

        return load;

        // let load = path;
        // load = load.charAt(0) === '/' ? load.slice(1) : load;
        // load = load.charAt(load.length-1) === '/' ? load.slice(0, load.length-1) : load;
        // load = load.split('/');
        // load.splice(-1, 1, 'default');
        // load.unshift(this.#folder);
        // load = load.join('/');

        // const route = await this.load({ path, name, load });
        // this.data.push(route);
        // return route;
    };

    async render (route) {

        if (!route) {
            throw new Error('Oxe.router.render - route required');
        }

        if (!route.target) {
            if (!route.name) throw new Error('Oxe.router.render - name required');
            if (!route.component) throw new Error('Oxe.router.render - component required');
            Define(route.name, route.component);
            route.target = window.document.createElement(route.name);
        }

        window.document.title = route.component.title || route.target.title || route.target.model.title;

        if (this.#target) {

            while (this.#target.firstChild) {
                this.#target.removeChild(this.#target.firstChild);
            }

            this.#target.appendChild(route.target);

        }

        window.scroll(0, 0);
    };

    async route (path, options:any = {}) {

        if (options.query) {
            path += Query(options.query);
        }

        const location = Location(path);
        const mode = options.mode || this.#mode;

        const route = await this.find(location.pathname);

        if (!route) {
            throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
        }

        if (typeof this.#before === 'function') {
            await this.#before(location);
        }

        if (route.handler) {
            return route.handler(location);
        }

        if (route.redirect) {
            return this.redirect(route.redirect);
        }

        Events(this.#target, 'before', location);

        if (mode === 'href') {
            return window.location.assign(location.path);
        }

        window.history[mode + 'State']({ path: location.path }, '', location.path);

        if (route.title) {
            window.document.title = route.title;
        }

        await this.render(route);

        if (typeof this.#after === 'function') {
            await this.#after(location);
        }

        Events(this.#target, 'after', location);
    };

    async state (event) {
        const path = event && event.state ? event.state.path : window.location.href;
        this.route(path, { mode: 'replace' });
    };

    async click (event) {

        // ignore canceled events, modified clicks, and right clicks
        if (
            event.target.type ||
            event.button !== 0 ||
            event.defaultPrevented ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        ) return;

        // if shadow dom use
        let target = event.path ? event.path[0] : event.target;
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

        // check non-acceptables
        const tel = 'tel:';
        const ftp = 'ftp:';
        const file = 'file:';
        const mailto = 'mailto:';

        if (target.hasAttribute('download') ||
            target.hasAttribute('external') ||
            target.hasAttribute('o-external') ||
            target.href.slice(0, tel.length) === tel ||
            target.href.slice(0, ftp.length) === ftp ||
            target.href.slice(0, file.length) === file ||
            target.href.slice(0, mailto.length) === mailto ||
            target.href.slice(window.location.origin) !== 0 ||
            (target.hash !== '' &&
                target.origin === window.location.origin &&
                target.pathname === window.location.pathname)
        ) return;

        // if external is true then default action
        if (this.#external &&
            (this.#external instanceof RegExp && this.#external.test(target.href) ||
                typeof this.#external === 'function' && this.#external(target.href) ||
                typeof this.#external === 'string' && this.#external === target.href)
        ) return;

        event.preventDefault();

        // if (this.location.href !== target.href) {
        this.route(target.href);
        // }
    }

}

// export default Object.freeze({
//     data,
//     setup, compareParts, compare,
//     scroll, back, forward, redirect,
//     add, get, find, remove, filter,
//     route, render, load,
//     state, click
// });
