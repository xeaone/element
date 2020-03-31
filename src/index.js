import Component from './component.js';
import Location from './location.js';
import Importer from './importer.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Binder from './binder.js';
import Define from './define.js';
import Router from './router.js';
import Style from './style.js';
import Class from './class.js';
import Query from './query.js';

if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function CustomEvent (event, options) {
        options = options || { bubbles: false, cancelable: false, detail: null };
        var customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
        return customEvent;
    };
}

if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};
    window.Reflect.construct = function construct (parent, args, child) {
        var target = child === undefined ? parent : child;
        var prototype = Object.create(target.prototype || Object.prototype);
        return Function.prototype.apply.call(parent, prototype, args) || prototype;
    };
}

// const setup = document.querySelector('script[o-setup]');
// const url = setup ? setup.getAttribute('o-setup') : '';
// if (setup) Load(url);

let SETUP = false;

export default Object.freeze({

    Class,
    class: Class,

    Style,
    style: Style,

    Component,
    component: Component,

    Query,
    query: Query,

    Location,
    location: Location,

    Define,
    define: Define,

    Binder,
    binder: Binder,

    Batcher,
    batcher: Batcher,

    Fetcher,
    fetcher: Fetcher,

    Importer,
    importer: Importer,

    Router,
    router: Router,

    setup (options = {}) {

        if (SETUP) return;
        else SETUP = true;

        options.listener = options.listener || {};

        // if (document.currentScript) {
        //     options.base = document.currentScript.src.replace(window.location.origin, '');
        // } else if (url) {
        //     const a = document.createElement('a');
        //     a.setAttribute('href', url);
        //     options.base = a.pathname;
        // }

        // options.base = options.base ? options.base.replace(/\/*\w*.js$/, '') : '/';
        // options.loader.base = options.base;
        // options.router.base = options.base;
        // options.component.base = options.base;

        return Promise.all([
            this.style.setup(options.style),
            this.binder.setup(options.binder),
            // this.loader.setup(options.loader),
            this.fetcher.setup(options.fetcher)
        ]).then(() => {
            if (options.listener.before) {
                return options.listener.before();
            }
        }).then(() => {
            if (options.router) {
                return this.router.setup(options.router);
            }
        }).then(() => {
            if (options.listener.after) {
                return options.listener.after();
            }
        });
    }

});
