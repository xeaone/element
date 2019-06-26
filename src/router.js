import Path from './path.js';
import Loader from './loader.js';
import Events from './events.js';
import Utility from './utility.js';
import Definer from './definer.js';
import Component from './component.js';

const Event = Object.create(Events);

export default {

    on: Event.on.bind(Event),
    off: Event.off.bind(Event),
    emit: Event.emit.bind(Event),

    data: [],
    ran: false,
    location: {},
    mode: 'push',
    target: null,
    contain: false,
    folder: './routes',

    async setup (option) {
        option = option || {};

        this.base = option.base === undefined ? this.base : option.base;
        this.mode = option.mode === undefined ? this.mode : option.mode;
        this.after = option.after === undefined ? this.after : option.after;
        this.folder = option.folder === undefined ? this.folder : option.folder;
        this.before = option.before === undefined ? this.before : option.before;
        this.change = option.change === undefined ? this.change : option.change;
        this.target = option.target === undefined ? this.target : option.target;
        this.contain = option.contain === undefined ? this.contain : option.contain;
        this.external = option.external === undefined ? this.external : option.external;

        if (!this.target || typeof this.target === 'string') {
            this.target = document.body.querySelector(this.target || 'o-router');
        }

        if (this.mode !== 'href') {
            window.addEventListener('popstate', this.state.bind(this), true);
            window.document.addEventListener('click', this.click.bind(this), true);
        }

        Definer.define('o-router');

        await this.add(option.routes);
        await this.route(window.location.href, { mode: 'replace' });
    },

    compareParts (routePath, userPath, split) {
        const compareParts = [];

        const routeParts = routePath.split(split);
        const userParts = userPath.split(split);

        if (userParts.length > 1 && userParts[userParts.length - 1] === '') {
            userParts.pop();
        }

        if (routeParts.length > 1 && routeParts[routeParts.length - 1] === '') {
            routeParts.pop();
        }

        for (let i = 0, l = routeParts.length; i < l; i++) {

            if (routeParts[i].slice(0, 1) === '(' && routeParts[i].slice(-1) === ')') {

                if (routeParts[i] === '(~)') {
                    return true;
                } else if (routeParts[i].indexOf('~') !== -1) {
                    if (userParts[i]) {
                        compareParts.push(userParts[i]);
                    }
                } else {
                    compareParts.push(userParts[i]);
                }

            } else if (routeParts[i] !== userParts[i]) {
                return false;
            } else {
                compareParts.push(routeParts[i]);
            }

        }

        if (compareParts.join(split) === userParts.join(split)) {
            return true;
        } else {
            return false;
        }
    },

    compare (routePath, userPath) {
        const base = Path.normalize(Path.base);

        userPath = Path.normalize(userPath);
        routePath = Path.normalize(routePath);

        if (userPath.slice(0, base.length) !== base) {
            userPath = Path.join(base, userPath);
        }

        if (routePath.slice(0, base.length) !== base) {
            routePath = Path.join(base, routePath);
        }

        if (this.compareParts(routePath, userPath, '/')) {
            return true;
        }

        if (this.compareParts(routePath, userPath, '-')) {
            return true;
        }

        return false;
    },

    toParameterObject (routePath, userPath) {
        let result = {};

        if (
            !routePath
			|| !userPath
			|| routePath === '/'
			|| userPath === '/'
        ) return result;

        const userParts = userPath.split(/\/|-/);
        const routeParts = routePath.split(/\/|-/);

        for (let i = 0, l = routeParts.length; i < l; i++) {
            let part = routeParts[i];

            if (part.slice(0, 1) === '(' && part.slice(-1) === ')') {
                const name = part.slice(1, part.length - 1).replace('~', '');
                result[name] = userParts[i];
            }

        }

        return result;
    },

    toQueryString (data) {
        let result = '?';

        for (let key in data) {
            let value = data[key];
            result += key + '=' + value + '&';
        }

        if (result.slice(-1) === '&') {
            result = result.slice(0, -1);
        }

        return result;
    },

    toQueryObject (path) {
        let result = {};

        if (path.indexOf('?') === 0) path = path.slice(1);
        let queries = path.split('&');

        for (let i = 0, l = queries.length; i < l; i++) {
            let query = queries[i].split('=');

            if (query[0] && query[1]) {
                result[query[0]] = query[1];
            }

        }

        return result;
    },

    toLocationObject (href) {
        const location = {};
        const parser = document.createElement('a');

        parser.href = href;

        location.href = parser.href;
        location.host = parser.host;
        location.port = parser.port;
        location.hash = parser.hash;
        location.search = parser.search;
        location.protocol = parser.protocol;
        location.hostname = parser.hostname;
        location.pathname = parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname;

        location.path = location.pathname + location.search + location.hash;

        // might need to check how base should work

        // var base = document.querySelector('base');
        //
        // location.pathname = parser.pathname;
        // location.base = base ? base.href : null;
        //
        // if (location.protocol === 'file:' && location.base) {
        // 	location.pathname = parser.pathname.replace(location.base.replace('file://', ''), '');
        // }
        //
        // location.pathname = location.pathname[0] === '/' ? location.pathname : '/' + location.pathname;
        // location.path = location.pathname + location.search + location.hash;

        return location;
    },

    scroll (x, y) {
        window.scroll(x, y);
    },

    back () {
        window.history.back();
    },

    forward () {
        window.history.forward();
    },

    redirect (path) {
        window.location.href = path;
    },

    async add (data) {
        if (!data) {
            return;
        } else if (data.constructor === String) {
            let path = data;

            if (path.slice(-3) === '.js') {
                path = path.slice(0, -3);
            }

            let load = path;

            if (path.slice(-5) === 'index') {
                path = path.slice(0, -5);
            }

            if (path.slice(-6) === 'index/') {
                path = path.slice(0, -6);
            }

            if (path.slice(0, 2) === './') {
                path = path.slice(2);
            }

            if (path.slice(0, 1) !== '/') {
                path = '/' + path;
            }

            load = load + '.js';
            load = Path.join(this.folder, load);

            this.data.push({ path, load });
        } else if (data.constructor === Object) {

            if (!data.path) {
                throw new Error('Oxe.router.add - route path required');
            }

            if (!data.load && !data.component) {
                throw new Error('Oxe.router.add -  route.component or route.load required');
            }

            this.data.push(data);
        } else if (data.constructor === Array) {

            for (let i = 0, l = data.length; i < l; i++) {
                await this.add(data[i]);
            }

        }
    },

    async load (route) {

        if (route.load) {
            const load = await Loader.load(route.load);
            route = Object.assign({}, load.default, route);
        }

        if (typeof route.component === 'string') {
            route.load = route.component;
            const load = await Loader.load(route.load);
            route.component = load.default;
        }

        return route;
    },

    async remove (path) {
        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.data[i].path === path) {
                this.data.splice(i, 1);
            }
        }
    },

    async get (path) {
        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.data[i].path === path) {
                this.data[i] = await this.load(this.data[i]);
                return this.data[i];
            }
        }
    },

    async filter (path) {
        const result = [];

        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.compare(this.data[i].path, path)) {
                this.data[i] = await this.load(this.data[i]);
                result.push(this.data[i]);
            }
        }

        return result;
    },

    async find (path) {
        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.compare(this.data[i].path, path)) {
                this.data[i] = await this.load(this.data[i]);
                return this.data[i];
            }
        }
    },

    async render (route) {

        if (!route) {
            throw new Error('Oxe.render - route argument required. Missing object option.');
        }

        if (!route.component && !route.target) {
            throw new Error('Oxe.render - route property required. Missing component or target option.');
        }

        if (route.title) {
            document.title = route.title;
        }

        const ensures = [];

        if (route.keywords) {
            ensures.push({
                name: 'meta',
                query: '[name="keywords"]',
                attributes: [
                    { name: 'name', value: 'keywords' },
                    { name: 'content', value: route.keywords }
                ]
            });
        }

        if (route.description) {
            ensures.push({
                name: 'meta',
                query: '[name="description"]',
                attributes: [
                    { name: 'name', value: 'description' },
                    { name: 'content', value: route.description }
                ]
            });
        }

        if (route.canonical) {
            ensures.push({
                name: 'link',
                query: '[rel="canonical"]',
                attributes: [
                    { name: 'rel', value: 'canonical' },
                    { name: 'href', value: route.canonical }
                ]
            });
        }

        if (ensures.length) {
            Promise.all(ensures.map(function (option) {
                return Promise.resolve().then(function () {
                    option.position = 'afterbegin';
                    option.scope = document.head;
                    return Utility.ensureElement(option);
                });
            }));
        }

        if (!route.target) {
            if (route.component.constructor === String) {
                route.target = window.document.createElement(route.component);
            } else if (route.component.constructor === Object) {
                Component.define(route.component);
                route.target = window.document.createElement(route.component.name);
            }
        }

        if (this.target) {
            while (this.target.firstChild) {
                this.target.removeChild(this.target.firstChild);
            }

            this.target.appendChild(route.target);
        }

        this.scroll(0, 0);
    },

    async route (path, options) {
        options = options || {};

        if (options.query) {
            path += this.toQueryString(options.query);
        }

        const mode = options.mode || this.mode;
        const location = this.toLocationObject(path);
        const route = await this.find(location.pathname);

        if (!route) {
            throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
        }

        location.route = route;
        location.title = location.route.title;
        location.query = this.toQueryObject(location.search);
        location.parameters = this.toParameterObject(location.route.path, location.pathname);

        if (location.route && location.route.handler) {
            return await location.route.handler(location);
        }

        if (location.route && location.route.redirect) {
            return await this.redirect(location.route.redirect);
        }

        if (typeof this.before === 'function') {
            await this.before(location);
        }

        this.emit('route:before', location);

        if (mode === 'href') {
            return window.location.assign(location.path);
        }

        window.history[mode + 'State']({ path: location.path }, '', location.path);

        this.location = location;

        await this.render(location.route);

        if (typeof this.after === 'function') {
            await this.after(location);
        }

        this.emit('route:after', location);
    },

    async state (event) {
        const path = event && event.state ? event.state.path : window.location.href;
        this.route(path, { mode: 'replace' });
    },

    async click (event) {

        // ignore canceled events, modified clicks, and right clicks
        if (
    		event.target.type ||
            event.button !== 0 ||
    		event.defaultPrevented ||
    		event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        ) {
            return;
        }

        // if shadow dom use
        var target = event.path ? event.path[0] : event.target;
        var parent = target.parentElement;

        if (this.contain) {

            while (parent) {

                if (parent.nodeName === 'O-ROUTER') {
                    break;
                } else {
                    parent = parent.parentElement;
                }

            }

            if (parent.nodeName !== 'O-ROUTER') {
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
        if (target.hasAttribute('download') ||
    		target.hasAttribute('external') ||
    		target.hasAttribute('o-external') ||
    		target.href.indexOf('tel:') === 0 ||
    		target.href.indexOf('ftp:') === 0 ||
    		target.href.indexOf('file:') === 0 ||
    		target.href.indexOf('mailto:') === 0 ||
    		target.href.indexOf(window.location.origin) !== 0 ||
    		(target.hash !== '' &&
                target.origin === window.location.origin &&
                target.pathname === window.location.pathname)
        ) return;

        // if external is true then default action
        if (this.external &&
    		(this.external.constructor === RegExp && this.external.test(target.href) ||
    		this.external.constructor === Function && this.external(target.href) ||
    		this.external.constructor === String && this.external === target.href)
        ) return;

        event.preventDefault();

        if (this.location.href !== target.href) {
            this.route(target.href);
        }

    }

};
