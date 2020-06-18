import Location from './location.js';
import Events from './events.js';
import Define from './define.js';
import Query from './query.js';
import Load from './load.js';

import basename from './path/basename.js';
import normalize from './path/normalize.js';

const self = {};
const data = [];

const absolute = function (path) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};

const setup = async function (option = {}) {

    self.after = option.after;
    self.before = option.before;
    self.external = option.external;
    self.mode = option.mode || 'push';
    self.target = option.target || 'main';
    self.folder = option.folder || './routes';
    self.contain = option.contain === undefined ? false : option.contain;

    if (typeof self.target === 'string') {
        self.target = document.body.querySelector(self.target);
    }

    if (self.mode !== 'href') {
        window.addEventListener('popstate', this.state.bind(this), true);
        window.document.addEventListener('click', this.click.bind(this), true);
    }

    await this.add(option.routes);
    await this.route(window.location.href, { mode: 'replace' });
};

const compareParts = function (routePath, userPath, split) {
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
};

const compare = function (routePath, userPath) {

    // userPath = Resolve(userPath);
    // routePath = Resolve(routePath);

    userPath = absolute(userPath);
    routePath = absolute(routePath);

    if (this.compareParts(routePath, userPath, '/')) {
        return true;
    }

    if (this.compareParts(routePath, userPath, '-')) {
        return true;
    }

    return false;
};

const scroll = function (x, y) {
    window.scroll(x, y);
};

const back = function () {
    window.history.back();
};

const forward = function () {
    window.history.forward();
};

const redirect = function (path) {
    window.location.href = path;
};

const add = async function (data) {
    if (!data) {
        throw new Error('Oxe.router.add - options required');
        // return;
    } else if (typeof data === 'string') {
        let load = data;
        let path = data;
        const name = 'r-' + basename(data, '.js');

        if (path.slice(-3) === '.js') path = path.slice(0, -3);
        if (path.slice(-5) === 'index') path = path.slice(0, -5);
        if (path.slice(-6) === 'index/') path = path.slice(0, -6);
        if (path.slice(0, 2) === './') path = path.slice(2);
        if (path.slice(0, 1) !== '/') path = '/' + path;

        if (load.slice(-3) !== '.js') load = load + '.js';
        if (load.slice(0, 2) === './') load = load.slice(2);
        if (load.slice(0, 1) !== '/') load = '/' + load;

        if (load.slice(0, 1) === '/') load = load.slice(1);
        if (self.folder.slice(-1) === '/') self.folder = self.folder.slice(0, -1);

        load = self.folder + '/' + load;
        load = absolute(load);

        // console.log(name, basename(name, '.js'));
        // console.log(path, basename(path, '.js'));
        // console.log(load, basename(load, '.js'));
        // console.log(path);
        // console.log(load);

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

const load = async function (route) {

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

const remove = async function (path) {
    for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].path === path) {
            this.data.splice(i, 1);
        }
    }
};

const get = async function (path) {
    for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].path === path) {
            this.data[i] = await this.load(this.data[i]);
            return this.data[i];
        }
    }
};

const filter = async function (path) {
    const result = [];

    for (let i = 0; i < this.data.length; i++) {
        if (this.compare(this.data[i].path, path)) {
            this.data[i] = await this.load(this.data[i]);
            result.push(this.data[i]);
        }
    }

    return result;
};

const find = async function (path) {
    for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].path === path) {
        // if (this.compare(this.data[i].path, path)) {
            this.data[i] = await this.load(this.data[i]);
            return this.data[i];
        }
    }

    let load = path;
    load = load.charAt(0) === '/' ? load.slice(1) : load;
    load = load.charAt(load.length-1) === '/' ? load.slice(0, load.length-1) : load;
    load = load.split('/');
    load.splice(-1, 1, 'default.js');
    load.unshift(self.folder);
    load = load.join('/');

    const name = 'r-' + basename(path);
    const route = await this.load({ path, name, load });
    this.data.push(route);
    return route;
};

const render = async function (route) {

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

    if (self.target) {

        while (self.target.firstChild) {
            self.target.removeChild(self.target.firstChild);
        }

        self.target.appendChild(route.target);

    }

    window.scroll(0, 0);
};

const route = async function (path, options = {}) {

    if (options.query) {
        path += Query(options.query);
    }

    const location = Location(path);
    const mode = options.mode || self.mode;

    const route = await this.find(location.pathname);

    if (!route) {
        throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
    }

    if (typeof self.before === 'function') {
        await self.before(location);
    }

    if (route.handler) {
        return route.handler(location);
    }

    if (route.redirect) {
        return this.redirect(route.redirect);
    }

    Events(self.target, 'before', location);

    if (mode === 'href') {
        return window.location.assign(location.path);
    }

    window.history[mode + 'State']({ path: location.path }, '', location.path);

    if (route.title) {
        window.document.title = route.title;
    }

    await this.render(route);

    if (typeof self.after === 'function') {
        await self.after(location);
    }

    Events(self.target, 'after', location);
};

const state = async function (event) {
    const path = event && event.state ? event.state.path : window.location.href;
    this.route(path, { mode: 'replace' });
};

const click = async function (event) {

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

    if (self.contain) {

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
    if (self.external &&
        (self.external.constructor === RegExp && self.external.test(target.href) ||
            self.external.constructor === Function && self.external(target.href) ||
            self.external.constructor === String && self.external === target.href)
    ) return;

    event.preventDefault();

    // if (this.location.href !== target.href) {
    this.route(target.href);
    // }

};

export default Object.freeze({
    data,
    setup, compareParts, compare,
    scroll, back, forward, redirect,
    add, get, find, remove, filter,
    route, render, load,
    state, click
});
