import Component from './component';
import Fetcher from './fetcher';
import Router from './router';
import Define from './define';
import Load from './load';
import Css from './css';

// declare global {
//     interface Window {
//         Reflect: any;
//         NodeList: any;
//         CustomEvent: any;
//     }
// }

// if (typeof window.CustomEvent !== 'function') {
//     window.CustomEvent = function CustomEvent (event, options) {
//         'use strict';
//         options = options || { bubbles: false, cancelable: false, detail: null };
//         var customEvent = document.createEvent('CustomEvent');
//         customEvent.initCustomEvent(event, options.bubbles, options.cancelable, options.detail);
//         return customEvent;
//     };
// }

// if (typeof window.Reflect !== 'object' && typeof window.Reflect.construct !== 'function') {
//     window.Reflect = window.Reflect || {};
//     window.Reflect.construct = function construct (parent, args, child) {
//         'use strict';
//         var target = child === undefined ? parent : child;
//         var prototype = Object.create(target.prototype || Object.prototype);
//         return Function.prototype.apply.call(parent, prototype, args) || prototype;
//     };
// }

// if (window.NodeList && !window.NodeList.prototype.forEach) {
//     window.NodeList.prototype.forEach = window.Array.prototype.forEach;
// }

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

if (!window.Node.prototype.getRootNode) {
    window.Node.prototype.getRootNode = function getRootNode (opt) {
        var composed = typeof opt === 'object' && Boolean(opt.composed);
        return composed ? getShadowIncludingRoot(this) : getRoot(this);
    };
    function getShadowIncludingRoot (node) {
        var root = getRoot(node);
        if (isShadowRoot(root)) return getShadowIncludingRoot(root.host);
        return root;
    }
    function getRoot (node) {
        if (node.parentNode != null) return getRoot(node.parentNode);
        return node;
    }
    function isShadowRoot (node) {
        return node.nodeName === '#document-fragment' && node.constructor.name === 'ShadowRoot';
    }
}

export default Object.freeze(new class Oxe {

    Component = Component;
    component = Component;

    Fetcher = Fetcher;
    fetcher = Fetcher;

    Router = Router;
    router = Router;

    Define = Define;
    define = Define;

    Load = Load;
    load = Load;

    Css = Css;
    css = Css;

});

