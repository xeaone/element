import { replaceChildren } from './poly';
var init = function (target, selector) {
    Object.defineProperties(target, { $mount: { value: selector } });
    if (!target.$tag)
        throw new Error('static tag required');
    if (!target.$mount)
        throw new Error('static mount required');
    var $extend = target.$extend;
    var $tag = target.$tag;
    var $mount = target.$mount;
    var ready = function () {
        var container = $mount === 'body' ? document.body : document.querySelector($mount);
        if (!container)
            throw new Error('XElement mount - container not found');
        var element = document.createElement($extend || $tag, $extend ? { is: $tag } : undefined);
        customElements.upgrade(element);
        replaceChildren(container, element);
    };
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', ready, { once: true });
    }
    else {
        ready();
    }
    return target;
};
export var mount = function (selector) {
    return function (constructor, context) {
        if (context !== undefined) {
            return context.addInitializer(function () { return init(constructor, selector); });
        }
        else {
            return init(constructor, selector);
        }
    };
};
export default mount;
