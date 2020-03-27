import Component from './component.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Binder from './binder.js';
import Define from './define.js';
import Router from './router.js';
import Style from './style.js';
import Load from './load.js';

if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function CustomEvent (event, params) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };
}

if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};
    window.Reflect.construct = function construct (parent, args, child) {
        var target = child === undefined ? parent : child;
        var prototype = target.prototype || Object.prototype;
        var copy = Object.create(prototype);
        return Function.prototype.apply.call(parent, copy, args) || copy;
    };
}

document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');

// const setup = document.querySelector('script[o-setup]');
// const url = setup ? setup.getAttribute('o-setup') : '';
// if (setup) Load(url);

let SETUP = false;

export default Object.freeze({

    Define,
    define: Define,

    Component,
    component: Component,

    Batcher,
    batcher: Batcher,

    Fetcher,
    fetcher: Fetcher,

    Binder,
    binder: Binder,

    Load,
    load: Load,

    Router,
    router: Router,

    Style,
    style: Style,

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
        //
        // options.base = options.base ? options.base.replace(/\/*\w*.js$/, '') : '/';
        // options.loader.base = options.base;
        // options.router.base = options.base;
        // options.component.base = options.base;

        // return Promise.all([
        //     this.path.setup(options.path),
        //     this.style.setup(options.style),
        //     this.binder.setup(options.binder),
        //     this.loader.setup(options.loader),
        //     this.fetcher.setup(options.fetcher)
        // ]).then(() => {
        //     if (options.listener.before) {
        //         return options.listener.before();
        //     }
        // }).then(() => {
        //     if (options.component) {
        //         return this.component.setup(options.component);
        //     }
        // }).then(() => {
        //     if (options.router) {
        //         return this.router.setup(options.router);
        //     }
        // }).then(() => {
        //     if (options.listener.after) {
        //         return options.listener.after();
        //     }
        // });
    }

});
