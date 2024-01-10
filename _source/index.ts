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

export default {

    Router,
    router: Router,

    html,

    ...mount,
    ...shadow,
    ...define,

    ...symbols,
    ...types,

};

export const text = function (selector: string) {
        console.log(arguments);
    return function (target: any,  nameOrContext: string | ClassFieldDecoratorContext) {
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

    }
}