
export default {

    async setup () {

        if (window.Reflect === undefined) {
            window.Reflect = window.Reflect || {};
            window.Reflect.construct = function (parent, args, child) {
                const target = child === undefined ? parent : child;
                const prototype = target.prototype || Object.prototype;
                const copy = Object.create(prototype);
                return Function.prototype.apply.call(parent, copy, args) || copy;
            };
        }

    },

    define (name, constructor) {
        constructor = constructor || function () {};

        const construct = function () {
            const instance = window.Reflect.construct(HTMLElement, [], this.constructor);
            constructor.call(instance);
            return instance;
        };

        const prototypes = Object.getOwnPropertyDescriptors(constructor.prototype);
        construct.prototype = Object.create(HTMLElement.prototype);

        Object.defineProperties(construct.prototype, prototypes);
        Object.defineProperty(construct.prototype, 'constructor', { enumerable: false, writable: true, value: construct });

        window.customElements.define(name, construct);
    }

}
