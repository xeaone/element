import Change from './listener/change.js';
import Submit from './listener/submit.js';
import Input from './listener/input.js';
import Reset from './listener/reset.js';
import State from './listener/state.js';
import Component from './component.js';
import Listener from './listener.js';
import Batcher from './batcher.js';
import Definer from './definer.js';
import Fetcher from './fetcher.js';
import Methods from './methods.js';
import Utility from './utility.js';
import Binder from './binder.js';
import Loader from './loader.js';
import Router from './router.js';
import Model from './model.js';
import Style from './style.js';
import Path from './path.js';

document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');

const oSetup = document.querySelector('script[o-setup]');

if (oSetup) {
    const options = oSetup.getAttribute('o-setup').split(/\s+|\s*,+\s*/);

    if (!options[0]) {
        throw new Error('Oxe - script attribute o-setup requires path');
    }

    Loader.type = options[1] || 'esm';

    Promise.resolve(Loader.load(options[0]));
}

let SETUP = false;
const GLOBAL = {};

export default {

    get global () { return GLOBAL; },

    get component () { return Component; },
    get batcher () { return Batcher; },
    get definer () { return Definer; },
    get fetcher () { return Fetcher; },
    get methods () { return Methods; },
    get utility () { return Utility; },
    get binder () { return Binder; },
    get loader () { return Loader; },
    get router () { return Router; },
    get model () { return Model; },
    get style () { return Style; },
    get path () { return Path; },

    async setup (options) {

        if (SETUP) return;
        else SETUP = true;

        options = options || {};
        options.listener = options.listener || {};

        await this.style.setup(options.style);
        await this.model.setup(options.model);
        await this.binder.setup(options.binder);
        await this.definer.setup(options.definer);

        document.addEventListener('input', Listener.bind(null, options, Input), true);
        document.addEventListener('reset', Listener.bind(null, options, Reset), true);
        document.addEventListener('change', Listener.bind(null, options, Change), true);
        document.addEventListener('submit', Listener.bind(null, options, Submit), true);
        window.addEventListener('popstate', Listener.bind(null, options, State), true);

        if (options.listener.before) {
            await options.listener.before();
        }

        if (options.path) {
            await this.path.setup(options.path);
        }

        if (options.fetcher) {
            await this.fetcher.setup(options.fetcher);
        }

        if (options.loader) {
            await this.loader.setup(options.loader);
        }

        if (options.component) {
            await this.component.setup(options.component);
        }

        if (options.router) {
            await this.router.setup(options.router);
        }

        if (options.listener.after) {
            await options.listener.after();
        }

    }

};
