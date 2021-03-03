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
    window.CustomEvent = function CustomEvent(event, options) {
        options = options || { bubbles: false, cancelable: false, detail: null };
        var customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
        return customEvent;
    };
}

if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
    window.Reflect = window.Reflect || {};
    window.Reflect.construct = function construct(parent, args, child) {
        var target = child === undefined ? parent : child;
        var prototype = Object.create(target.prototype || Object.prototype);
        return Function.prototype.apply.call(parent, prototype, args) || prototype;
    };
}

// const setup = document.querySelector('script[o-setup]');
// const url = setup ? setup.getAttribute('o-setup') : '';
// if (setup) Load(url);

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

