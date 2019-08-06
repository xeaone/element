
let BASE;

export default {

    get base () {
        if (!BASE) BASE = window.document.querySelector('base');
        if (BASE) return BASE.href;
        return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
    },

    async setup (option) {
        option = option || {};

        if (option.base) {
            BASE = window.document.querySelector('base');

            if (!BASE) {
                BASE = window.document.createElement('base');
                window.document.head.insertBefore(BASE, window.document.head.firstElementChild);
            }

            BASE.href = option.base;
        }

    },

    extension (data) {
        const position = data.lastIndexOf('.');
        return position > 0 ? data.slice(position + 1) : '';
    },

    clean (data) {
        const hash = window.location.hash;
        const search = window.location.search;
        const origin = window.location.origin;
        const protocol = window.location.protocol + '//';

        if (data.slice(0, origin.length) === origin) {
            data = data.slice(origin.length);
        }

        if (data.slice(0, protocol.length) === protocol) {
            data = data.slice(protocol.length);
        }

        if (data.slice(-hash.length) === hash) {
            data = data.slice(0, -hash.length);
        }

        if (data.slice(-search.length) === search) {
            data = data.slice(0, -search.length);
        }

        return data || '/';
    },

    normalize (data) {
        const parser = window.document.createElement('a');

        data = this.clean(data);
        data = data.replace(/\/+/g, '/');

        parser.href = data;

        data = parser.pathname;
        data = data ? data : '/';

        if (data !== '/' && data.slice(-1) === '/') {
            data = data.slice(0, -1);
        }

        return data;
    },

    join () {

        if (!arguments.length) {
            throw new Error('Oxe.path.join - argument required');
        }

        const result = [];

        for (let i = 0, l = arguments.length; i < l; i++) {
            result.push(arguments[i]);
        }

        return this.normalize(result.join('/'));
    }

}
