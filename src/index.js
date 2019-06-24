import Change from './listener/change.js';
import Submit from './listener/submit.js';
import Input from './listener/input.js';
import Reset from './listener/reset.js';
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

let SETUP = false;
const GLOBAL = {};

export default Object.freeze({

    global: GLOBAL,
    component: Component,
    batcher: Batcher,
    definer: Definer,
    fetcher: Fetcher,
    methods: Methods,
    utility: Utility,
    binder: Binder,
    loader: Loader,
    router: Router,
    model: Model,
    style: Style,
    path: Path,

    setup (options) {
        const self = this;

        if (SETUP) return;
        else SETUP = true;

        options = options || {};
        options.listener = options.listener || {};

        document.addEventListener('input', Listener.bind(null, options, Input), true);
        document.addEventListener('reset', Listener.bind(null, options, Reset), true);
        document.addEventListener('change', Listener.bind(null, options, Change), true);
        document.addEventListener('submit', Listener.bind(null, options, Submit), true);

        return Promise.all([
            self.path.setup(options.path),
            self.style.setup(options.style),
            self.model.setup(options.model),
            self.binder.setup(options.binder),
            self.definer.setup(options.definer),
            self.fetcher.setup(options.fetcher),
            self.loader.setup(options.loader),
        ]).then(function () {
            if (options.listener.before) {
                return options.listener.before();
            }
        }).then(function () {
            if (options.component) {
                return self.component.setup(options.component);
            }
        }).then(function () {
            if (options.router) {
                return self.router.setup(options.router);
            }
        }).then(function () {
            const oSetup = document.querySelector('script[o-setup]');

            if (!oSetup) return;

            const attribute = oSetup.getAttribute('o-setup');

            if (!attribute) {
                throw new Error('Oxe - attribute o-setup requires arguments');
            }

            const options = attribute.split(/\s+|\s*,+\s*/);

            Loader.type = options[1] || 'esm';

            return Loader.load(options[0]);
        }).then(function () {
            if (options.listener.after) {
                return options.listener.after();
            }
        });
    }

});
