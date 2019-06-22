
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

        const prototypes = Object.getOwnPropertyDescriptors(constructor.prototype);

        // const properties = Object.assign({}, constructor);
        // const prototypes = Object.assign({}, constructor.prototype);
        // const properties = Object.getOwnPropertyDescriptors(constructor);

        // delete properties.name;
        // delete properties.caller;
        // delete properties.length;
        // delete properties.arguments;
        // delete properties.prototype;

        const construct = function () {
            const instance = window.Reflect.construct(HTMLElement, [], this.constructor);
            constructor.call(instance);
            return instance;
        };

        construct.prototype = Object.create(HTMLElement.prototype);

        // Object.assign(construct, properties);
        // Object.assign(construct.prototype, prototypes);
        // Object.defineProperties(construct, properties);
        Object.defineProperties(construct.prototype, prototypes);
        Object.defineProperty(construct.prototype, 'constructor', { enumerable: false, writable: true, value: construct });

        window.customElements.define(name, construct);
    }

}
