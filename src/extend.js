
if (window.Reflect === undefined) {
    window.Reflect = window.Reflect || {};
    window.Reflect.construct = function (parent, args, child) {
        const target = child === undefined ? parent : child;
        const prototype = target.prototype || Object.prototype;
        const copy = Object.create(prototype);
        return Function.prototype.apply.call(parent, copy, args) || copy;
    };
}

export default function (extender, extending) {

    const construct = function () {
        const instance = window.Reflect.construct(extending, [], this.constructor);
        extender.call(instance);
        return instance;
    };

    const prototypes = Object.getOwnPropertyDescriptors(extender.prototype);
    construct.prototype = Object.create(extending.prototype);

    Object.defineProperties(construct.prototype, prototypes);
    Object.defineProperty(construct.prototype, 'constructor', { enumerable: false, writable: true, value: construct });

    return construct;
}
