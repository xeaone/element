import Query from './query.js';
import Define from './define.js';
import Import from './import.js';
import Events from './events.js';
import Location from './location.js';
import Ensure from './tool/ensure.js';
import Absolute from './tool/absolute.js';
// import Component from './component.js';

const data = [];
let mode, after, before, target, contain, external, folder;

const setup = async function (option = {}) {

    mode = option.mode === undefined ? mode : 'push';
    after = option.after === undefined ? after : null;
    before = option.before === undefined ? before : null;
    target = option.target === undefined ? target : null;
    contain = option.contain === undefined ? contain : false;
    external = option.external === undefined ? external : null;
    folder = option.folder === undefined ? folder : './routes';

    if (!target || typeof target === 'string') {
        target = document.body.querySelector(target || 'o-router');
    }

    if (mode !== 'href') {
        window.addEventListener('popstate', this.state.bind(this), true);
        window.document.addEventListener('click', this.click.bind(this), true);
    }

    const ORouter = function ORouter () { return window.Reflect.construct(HTMLElement, arguments, this.constructor); };
    ORouter.prototype = HTMLElement.prototype;
    Object.defineProperty(ORouter.prototype, 'constructor', { enumerable: false, writable: true, value: ORouter });
    window.customElements.define('o-router', ORouter);

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

    userPath = Absolute(userPath);
    routePath = Absolute(routePath);

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
        return;
    } else if (data.constructor === String) {
        let load = data;
        let path = data;

        if (path.slice(-3) === '.js') path = path.slice(0, -3);
        if (path.slice(-5) === 'index') path = path.slice(0, -5);
        if (path.slice(-6) === 'index/') path = path.slice(0, -6);
        if (path.slice(0, 2) === './') path = path.slice(2);
        if (path.slice(0, 1) !== '/') path = '/' + path;

        if (load.slice(-3) !== '.js') load = load + '.js';
        if (load.slice(0, 2) === './') load = load.slice(2);
        if (load.slice(0, 1) !== '/') load = '/' + load;

        if (folder.slice(-1) === '/') folder = folder.slice(0, -1);

        load = folder + '/' + load;

        this.data.push({ path, load });
    } else if (data.constructor === Object) {

        if (!data.path) {
            throw new Error('Oxe.router.add - route path required');
        }

        if (!data.name && !data.load && !data.component) {
            throw new Error('Oxe.router.add -  route requires name, load, or component property');
        }

        this.data.push(data);
    } else if (data.constructor === Array) {

        for (let i = 0, l = data.length; i < l; i++) {
            await this.add(data[i]);
        }

    }
};

const load = async function (route) {

    if (route.load) {
        const load = await Import(route.load);
        route = Object.assign({}, load.default, route);
    }

    if (typeof route.component === 'string') {
        route.load = route.component;
        const load = await Import(route.load);
        route.component = load.default;
    }

    return route;
};

const remove = async function (path) {
    for (let i = 0, l = this.data.length; i < l; i++) {
        if (this.data[i].path === path) {
            this.data.splice(i, 1);
        }
    }
};

const get = async function (path) {
    for (let i = 0, l = this.data.length; i < l; i++) {
        if (this.data[i].path === path) {
            this.data[i] = await this.load(this.data[i]);
            return this.data[i];
        }
    }
};

const filter = async function (path) {
    const result = [];

    for (let i = 0, l = this.data.length; i < l; i++) {
        if (this.compare(this.data[i].path, path)) {
            this.data[i] = await this.load(this.data[i]);
            result.push(this.data[i]);
        }
    }

    return result;
};

const find = async function (path) {
    for (let i = 0, l = this.data.length; i < l; i++) {
        if (this.compare(this.data[i].path, path)) {
            this.data[i] = await this.load(this.data[i]);
            return this.data[i];
        }
    }
};

const render = async function (route) {

    if (!route) {
        throw new Error('Oxe.render - route argument required. Missing object option.');
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
                return Ensure(option);
            });
        }));
    }

    if (!route.target) {
        if (!route.component) {
            Define(route);
            route.target = window.document.createElement(route.name);
        } else if (route.component.constructor === String) {
            route.target = window.document.createElement(route.component);
        } else if (route.component.constructor === Object) {
            Define(route.component);
            route.target = window.document.createElement(route.component.name);
        } else {
            throw new Error('Oxe.router.render - route requires name, load, or component property');
        }
    }

    if (target) {
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        target.appendChild(route.target);
    }

    this.scroll(0, 0);
};

const route = async function (path, options) {
    options = options || {};

    if (options.query) {
        path += Query(options.query);
    }

    const location = Location(path);
    const route = await this.find(location.pathname);

    if (!route) {
        throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
    }

    if (typeof before === 'function') {
        await before(location);
    }

    if (route.handler) {
        return route.handler(location);
    }

    if (route.redirect) {
        return this.redirect(route.redirect);
    }

    Events(target, 'before', location);

    if ((options.mode || mode) === 'href') {
        return window.location.assign(location.path);
    }

    window.history[mode + 'State']({ path: location.path }, '', location.path);

    if (route.title) {
        window.document.title = route.title;
    }

    await this.render(route);

    if (typeof after === 'function') {
        await after(location);
    }

    Events(target, 'after', location);
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
    ) {
        return;
    }

    // if shadow dom use
    var target = event.path ? event.path[0] : event.target;
    var parent = target.parentElement;

    if (contain) {

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
    if (external &&
        (external.constructor === RegExp && external.test(target.href) ||
            external.constructor === Function && external(target.href) ||
            external.constructor === String && external === target.href)
    ) return;

    event.preventDefault();

    if (this.location.href !== target.href) {
        this.route(target.href);
    }

};

export default Object.freeze({
    data,
    setup, compareParts, compare,
    scroll, back, forward, redirect,
    add, get, find, remove, filter,
    route, render, load,
    state, click
});
