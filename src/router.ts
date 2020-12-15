import Location from './location';
import Events from './events';
import Query from './query';
import Load from './load';

import basename from './path/basename';
// import normalize from './path/normalize';

type  Route = {
    name : string;
    path : string;
    load : string;
    target? : any;
    title? : string;
    component? : any;
    redirect? : string;
    handler? : (location:any) => void;
}

type Option = {
    folder?: string;
    contain?: boolean;
    external?: string;
    routes?: Array<Route>;
    target?: string | Element;
    mode?: 'push' | 'replace' | 'href';
    after?: (location:any) => Promise<void>;
    before?: (location:any) => Promise<void>;
}

const absolute = function (path:string) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};

export default new class Router {

    data: Array<Route> = [];

    #folder: string;
    #target: Element;
    #contain: boolean;
    #external: string | RegExp | Function;
    #after: (location:any) => Promise<void>;
    #before: (location:any) => Promise<void>;
    #mode: 'push' | 'replace' | 'href' = 'push';

    async setup (option:Option = {}) {

        this.#after = option.after;
        this.#before = option.before;
        this.#external = option.external;
        this.#mode = option.mode ?? 'push';
        this.#contain = option.contain ?? false;
        this.#folder = option.folder ?? './routes';
        this.#target =  option.target instanceof Element ? option.target : document.body.querySelector(option.target || 'main'); 

        if (this.#mode !== 'href') {
            console.log(this.#mode);
            window.addEventListener('popstate', this.state.bind(this), true);
            window.document.addEventListener('click', this.click.bind(this), true);
        }

        await this.add(option.routes);
        await this.route(window.location.href, { mode: 'replace' });
    };

    compare (routePath:string, userPath:string) {
        const userParts = absolute(userPath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');
        const routeParts = absolute(routePath).replace(/(\-|\/)/g, '**$1**').replace(/^\*\*|\*\*$/g, '').split('**');

        for (let i = 0, l = userParts.length; i < l; i++) {
            if (routeParts[i] === 'any') return true;
            if (routeParts[i] !== userParts[i]) return false;
        }

        return true;
    };

    scroll (x:number, y:number) {
        window.scroll(x, y);
    };

    async back () {
        window.history.back();
    };

    async forward () {
        window.history.forward();
    };

    async redirect (path:string) {
        window.location.href = path;
    };

    async add (data : string | Array<string|Route> | Route) {
        // if (!data) {
        //     throw new Error('Oxe.router.add - options required');
        // } else
        if (typeof data === 'string') {
            let load = data;
            let path = data;

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

            const name = `r-${data.replace('/', '-')}`;

            this.add({ path, name, load });
        } else if (data instanceof Array) {
            return Promise.all(data.map(route => this.add(route)));
        } else {
            // if (!data.name) throw new Error('Oxe.router.add - name required');
            // if (!data.path) throw new Error('Oxe.router.add - path required');
            // if (!data.load) throw new Error('Oxe.router.add - load required');
            this.data.push(data);
        }
    };

    async remove (path:string) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data.splice(i, 1);
            }
        }
    };

    async get (path:string) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].path === path) {
                this.data[i] = await this.load(this.data[i]);
                return this.data[i];
            }
        }
    };

    async filter (path:string) {
        const result = [];

        for (let i = 0; i < this.data.length; i++) {
            if (this.compare(this.data[i].path, path)) {
                this.data[i] = await this.load(this.data[i]);
                result.push(this.data[i]);
            }
        }

        return result;
    };

    async load (route:Route) {

        if (!route.component) {
            const load = await Load(route.load);
            route.component = load.default;
        }

        return route;
    };

    async find (path:string) {
        const route = this.data.find(route => this.compare(route.path, path));
        return route ? await this.load(route) : null;
    };

    async render (route:Route) {

        if (!route.target) {
            if (!route.name) throw new Error('Oxe.router.render - name required');
            if (!route.component) throw new Error('Oxe.router.render - component required');
            window.customElements.define(route.name, route.component);
            route.target = window.document.createElement(route.name);
        }

        window.document.title = route.component.title || route.target.title;

        if (!this.#target) {
            throw new Error(`Oxe.router.render - target required`);
        }

        while (this.#target.firstChild) {
            this.#target.removeChild(this.#target.firstChild);
        }

        this.#target.appendChild(route.target);

        window.scroll(0, 0);
    };

    async route (path:string, options:any = {}) {

        if (options.query) {
            path += Query(options.query);
        }

        const location = Location(path);
        const mode = options.mode || this.#mode;
        const route = await this.find(location.pathname);

        if (!route) {
            throw new Error(`Oxe.router.route - ${location.pathname} not found`);
        }

        // if (route.handler) {
        //     return route.handler(location);
        // }

        // if (route.redirect) {
        //     return this.redirect(route.redirect);
        // }

        // Events(this.#target, 'before', location);

        if (mode === 'href') {
            return window.location.assign(location.path);
        }
 
        if (typeof this.#before === 'function') {
            await this.#before(location);
        }
       
        Events(this.#target, 'before', location);

        window.history[mode + 'State']({ path: location.path }, '', location.path);

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
        this.route(target.href);
    };

}
