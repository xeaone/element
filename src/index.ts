import Component from './component';
import Location from './location';
import Batcher from './batcher';
import Fetcher from './fetcher';
import Binder from './binder';
import Define from './define';
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
        'use strict';
        options = options || { bubbles: false, cancelable: false, detail: null };
        var customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
        return customEvent;
    };
}

if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};
    window.Reflect.construct = function construct (parent, args, child) {
        'use strict';
        var target = child === undefined ? parent : child;
        var prototype = Object.create(target.prototype || Object.prototype);
        return Function.prototype.apply.call(parent, prototype, args) || prototype;
    };
}

if (!window.String.prototype.startsWith) {
    window.String.prototype.startsWith = function startsWith (search, rawPos) {
        'use strict';
        var pos = rawPos > 0 ? rawPos | 0 : 0;
        return this.substring(pos, pos + search.length) === search;
    };
}

if (!window.String.prototype.includes) {
    window.String.prototype.includes = function includes (search: any, start) {
        'use strict';
        if (search instanceof RegExp) throw TypeError('first argument must not be a RegExp');
        if (start === undefined) { start = 0; }
        return this.indexOf(search, start) !== -1;
    };
}

export default Object.freeze(new class Oxe {

    Component = Component;
    component = Component;

    Location = Location;
    location = Location;

    Batcher = Batcher;
    batcher = Batcher;

    Fetcher = Fetcher;
    fetcher = Fetcher;

    Binder = Binder;
    binder = Binder;

    Define = Define;
    define = Define;

    Load = Load;
    load = Load;

    Css = Css;
    css = Css;

});

