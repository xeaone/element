import Router from './router';
import html from './html';

import * as symbols from './symbols';
export * from './symbols';

import * as define from './define';
export * from './define';

import * as types from './types';
export * from './types';

export { Router };
export { Router as router };

export { html };

export default {

    Router,
    router: Router,

    html,

    ...define,
    ...symbols,
    ...types,
};
