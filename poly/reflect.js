
// custom elements with es5 classes

(function() {
	'use strict';


    if (window.Reflect === undefined) {
        window.Reflect = window.Reflect || {};
        window.Reflect.construct = function (parent, args, child) {
            var target = child === undefined ? parent : child;
            var prototype = target.prototype || Object.prototype;
            var copy = Object.create(prototype);
            return Function.prototype.apply.call(parent, copy, args) || copy;
        };
    }

    // if (
    // 	!(window.Reflect === undefined ||
    // 	window.customElements === undefined ||
    // 	window.customElements.hasOwnProperty('polyfillWrapFlushCallback'))
    // ) {
    // 	let htmlelement = HTMLElement;
    // 	window.HTMLElement = function HTMLElement () { return Reflect.construct(htmlelement, [], this.constructor); };
    // 	HTMLElement.prototype = htmlelement.prototype;
    // 	HTMLElement.prototype.constructor = HTMLElement;
    // 	Object.setPrototypeOf(HTMLElement, htmlelement);
    // }

}());
