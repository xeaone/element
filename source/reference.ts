import { ReferenceType } from './types';

// if (!('WeakRef' in globalThis)) {
//     globalThis['WeakRef'] = (function () {
//         const wm = new WeakMap();
//         const WeakRef = function (target) {
//             wm.set(this, target);
//         };
//         WeakRef.prototype.deref = function () {
//             return wm.get(this);
//         };
//         return WeakRef as any;
//     })();
// }

export const Reference = function <T>(data: T): ReferenceType<T> {
    return {
        data: data instanceof Node ? new WeakRef(data) : data,
        get: function <T>(): T | undefined {
            if (this.data instanceof WeakRef) {
                return this.data.deref();
            } else {
                return this.data;
            }
        },
        set: function <T>(data: T): T | undefined {
            if (data instanceof Node) {
                this.data = new WeakRef(data);
                return data;
            } else {
                this.data = data;
                return data;
            }
        },
    };
};
