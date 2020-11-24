import Component from './component';
import Location from './location';
import Batcher from './batcher';
import Fetcher from './fetcher';
import Binder from './binder';
import Define from './define';
import Router from './router';
import Class from './class';
import Query from './query';
import Load from './load';
import Css from './css';

declare global {
    interface Window {
        Reflect: any;
        CustomEvent: any;
    }
}

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

const setup = document.querySelector('script[o-setup]');
const url = setup ? setup.getAttribute('o-setup') : '';
if (setup) Load(url);

let SETUP = false;

// interface Options {
//     binder: object;
//     router: object;
//     fetcher: object;
//     listener: object;
// }

// export default Object.freeze({
export default class Oxe {

    static readonly Component;
    static readonly component = Component;

    static readonly Location;
    static readonly location = Location;

    static readonly Batcher;
    static readonly batcher = Batcher;

    static readonly Fetcher;
    static readonly fetcher = Fetcher;

    static readonly Router;
    static readonly router = Router;

    static readonly Binder;
    static readonly binder = Binder;

    static readonly Define;
    static readonly define = Define;

    static readonly Class;
    static readonly class = Class;

    static readonly Query;
    static readonly query = Query;

    static readonly Load;
    static readonly load = Load;

    static readonly Css;
    static readonly css = Css;

    private constructor () {}

    setup (options: any) {

        if (SETUP) return;
        else SETUP = true;

        // options.listener = options.listener || {};

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
            // this.loader.setup(options.loader),
            Oxe.binder.setup(options.binder),
            Oxe.fetcher.setup(options.fetcher),
            options.router ? Oxe.router.setup(options.router) : null
        ]);
        // .then(() => {
        //     if (options.listener.before) {
        //         return options.listener.before();
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

}
// });
