
const assignOwnPropertyDescriptors = function (target, source) {
    for (const name in source) {
        if (Object.prototype.hasOwnProperty.call(source, name)) {
            const descriptor = Object.getOwnPropertyDescriptor(source, name);
            Object.defineProperty(target, name, descriptor);
        }
    }
    return target;
};

export default function (parent, child) {

    child = child || parent;
    parent = parent === child ? undefined : parent;

    const prototype = typeof child === 'function' ? child.prototype : child;
    const constructor = typeof child === 'function' ? child : child.constructor;

    const Class = function Class () {
        const self = this;
        // const self = constructor.apply(this, arguments) || this;
        // console.log(child.hasOwnProperty('constructor'));

        constructor.apply(self, arguments);

        if ('Super' in self) {
            if ('_Super' in self) {
                return assignOwnPropertyDescriptors(self._Super, self);
            } else {
                throw new Error('Class this.Super call required');
            }
        } else {
            return self;
        }

    };

    if (parent) {
        assignOwnPropertyDescriptors(Class, parent);
        Class.prototype = Object.create(parent.prototype);
        assignOwnPropertyDescriptors(Class.prototype, prototype);

        const Super = function () {
            if (this._Super) return this._Super;
            this._Super = window.Reflect.construct(parent, arguments, this.constructor);
            assignOwnPropertyDescriptors(this.Super, parent.prototype);
            return this._Super;
        };

        Object.defineProperty(Class.prototype, 'Super', { enumerable: false, writable: true, value: Super });
    } else {
        Class.prototype = Object.create({});
        assignOwnPropertyDescriptors(Class.prototype, prototype);
    }

    Object.defineProperty(Class.prototype, 'constructor', { enumerable: false, writable: true, value: Class });

    return Class;
}
