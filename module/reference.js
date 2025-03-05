/**
* @version 10.0.1
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
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
export const Reference = function (data) {
    return {
        data: data instanceof Node ? new WeakRef(data) : data,
        get: function () {
            if (this.data instanceof WeakRef) {
                return this.data.deref();
            }
            else {
                return this.data;
            }
        },
        set: function (data) {
            if (data instanceof Node) {
                this.data = new WeakRef(data);
                return data;
            }
            else {
                this.data = data;
                return data;
            }
        },
    };
};
