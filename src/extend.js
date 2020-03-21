
export default function extend (parent, child) {

    const construct = function construct () {
        const self = window.Reflect.construct(parent, [], this.constructor);
        window.Reflect.construct(child, arguments, self.constructor);
        return self;
    };

    child.prototype = Object.create(parent.prototype);
    // child.prototype.constructor = child;
    Object.defineProperty(child.prototype, 'constructor', { enumerable: false, writable: true, value: child });

    construct.prototype = Object.create(child.prototype);
    // construct.prototype.constructor = construct;
    Object.defineProperty(construct.prototype, 'constructor', { enumerable: false, writable: true, value: construct });

    return construct;
}

// const extend = function (extending, extender) {
//
//     extender.prototype = Object.create(extending.prototype);
//     extender.prototype.constructor = extender;
//
//     const clone = function () {
//         const self = window.Reflect.construct(extender, arguments, this.constructor);
//         if (extending && !self._parent) throw new Error('must invoke this.parent()');
//         return window.Reflect.construct(extending, self._parent, self.constructor);
//     };
//
//     clone.prototype = Object.create(extender.prototype);
//     clone.prototype.constructor = clone;
//
//     clone.prototype.parent = function () {
//         if (!extending) throw new Error('can not invoke this.parent()');
//         if (this._parent) {
//             return this._parent;
//         } else {
//             return this._parent = arguments;
//         }
//     };
//
//     return clone;
// };

// export default function extend (extender, extending) {
//
//     const construct = function () {
//         const instance = window.Reflect.construct(extending, arguments, construct);
//         window.Reflect.construct(extender, arguments);
//         // extender.call(instance);
//         return instance;
//     };
//
//     const prototypes = Object.getOwnPropertyDescriptors(extender.prototype);
//     construct.prototype = Object.create(extending.prototype);
//
//     Object.defineProperties(construct.prototype, prototypes);
//     Object.defineProperty(construct.prototype, 'constructor', { enumerable: false, writable: true, value: construct });
//
//     return construct;
// }
