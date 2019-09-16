import Transformer from './transformer.js';
import Path from './path.js';

// import export in strings cause error
// backtick in template strings or regex could possibly causes issues

// let IMPORT;
//
// try {
//     new Function('import("")');
//     IMPORT = true;
// } catch (e) {
//     IMPORT = false;
// }

export default {

    data: {},
    type: 'esm',

    async setup (options) {
        const self = this;

        options = options || {};
        this.type = options.type || this.type;

        if (options.loads) {
            return Promise.all(options.loads.map(function (load) {
                return self.load(load);
            }));
        }

    },

    async fetch (url, type) {
        const data = await window.fetch(url);

        if (data.status == 404) {
            throw new Error('Oxe.loader.load - not found ' + url);
        }

        if (data.status < 200 || data.status > 300 && data.status != 304) {
            throw new Error(data.statusText);
        }

        let code = await data.text();

        if (type === 'es' || type === 'est') {
            code = Transformer.template(code);
        }

        if (type === 'es' || type === 'esm') {
            code = Transformer.module(code, url);
        }

        try {
            const method = new Function('window', 'document', '$LOADER', code);
            const result = await method(window, window.document, this);
            return this.data[url] = result;
        } catch (error) {
            throw new error.constructor(`${error.message} - ${url}`);
        }

    },

    async load () {
        let url, type;

        if (typeof arguments[0] === 'object') {
            url = arguments[0]['url'];
            type = arguments[0]['type'];
        } else {
            url = arguments[0];
            type = arguments[1] || this.type;
        }

        if (!url) {
            throw new Error('Oxe.loader.load - url argument required');
        }

        url = Path.normalize(url);

        if (url in this.data === false) {
            this.data[url] = this.fetch(url, type);
        }

        return this.data[url];
    }

};
