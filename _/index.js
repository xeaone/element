var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import Router from './router';
import html from './html';
import * as symbols from './symbols';
export * from './symbols';
import * as mount from './mount';
export * from './mount';
import * as define from './define';
export * from './define';
import * as shadow from './shadow';
export * from './shadow';
import * as types from './types';
export * from './types';
export { Router };
export { Router as router };
export { html };
export default __assign(__assign(__assign(__assign(__assign({ Router: Router, router: Router, html: html }, mount), shadow), define), symbols), types);
export var text = function (selector) {
    console.log(arguments);
    return function (target, nameOrContext) {
        console.log(arguments);
        // if (nameOrContext === 'string') {
        //     const reference = Symbol('XTextReference');
        //     target[internal]
        //     Object.defineProperties(target.prototype, {
        //         [ nameOrContext ]: {
        //             get () { return this[ reference ]; },
        //             set (value) { this[ reference ] = value; },
        //         }
        //     });
        // } else {
        // }
    };
};
