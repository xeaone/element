import Component from './component.js';
import Batcher from './batcher.js';
import Fetcher from './fetcher.js';
import Binder from './binder.js';
import Loader from './loader.js';
import Router from './router.js';
import Style from './style.js';
import Path from './path.js';

console.warn('todo: need to allow multiple o- attributes');

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

        if (SETUP) return;
        else SETUP = true;

        options = options || {};
        options.listener = options.listener || {};

        return Promise.all([
            this.path.setup(options.path),
            this.style.setup(options.style),
            this.binder.setup(options.binder),
            this.loader.setup(options.loader),
            this.fetcher.setup(options.fetcher)
        ]).then(() => {
            if (options.listener.before) {
                return options.listener.before();
            }
        }).then(() => {
            if (options.component) {
                return this.component.setup(options.component);
            }
        }).then(() => {
            if (options.router) {
                return this.router.setup(options.router);
            }
        }).then(() => {
            if (options.listener.after) {
                return options.listener.after();
            }
        });
    }

});
