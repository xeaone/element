import Component from './component.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Binder from './binder.js';
import Loader from './loader.js';
import Router from './router.js';
import Style from './style.js';
import Path from './path.js';

document.head.insertAdjacentHTML('afterbegin', '<style>:not(:defined){visibility:hidden;}o-router,o-router>:first-child{display:block;}</style>');

const oSetup = document.querySelector('script[o-setup]');

if (oSetup) {
    Promise.resolve().then(function () {
        const attribute = oSetup.getAttribute('o-setup');

        if (!attribute) {
            throw new Error('Oxe - attribute o-setup requires arguments');
        }

        const options = attribute.split(/\s+|\s*,+\s*/);

        Loader.options.type = options[1] || 'esm';

        return Loader.load(options[0]);
    });
}

let SETUP = false;
const GLOBAL = {};

export default Object.freeze({

    global: GLOBAL,
    component: Component,
    batcher: Batcher,
    fetcher: Fetcher,
    binder: Binder,
    loader: Loader,
    router: Router,
    style: Style,
    path: Path,

    setup (options) {
        const self = this;

        if (SETUP) return;
        else SETUP = true;

        options = options || {};
        options.listener = options.listener || {};

        return Promise.all([
            self.path.setup(options.path),
            self.style.setup(options.style),
            self.binder.setup(options.binder),
            self.loader.setup(options.loader),
            self.fetcher.setup(options.fetcher),
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
            if (options.listener.after) {
                return options.listener.after();
            }
        });
    }

});
