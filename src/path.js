
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

    resolve () {
        const result = [];
        const origin = window.location.origin;
        const parser = window.document.createElement('a');

        for (let i = 0, l = arguments.length; i < l; i++) {
            const path = arguments[i];
            if (!path) continue;
            parser.href = path;
            if (parser.origin === origin) {
                if (path.indexOf(origin) === 0) {
                    result.push(path.slice(origin.length));
                } else {
                    result.push(path);
                }
            } else {
                return path;
            }
        }

        parser.href = result.join('/').replace(/\/+/g, '/');

        return parser.pathname;
    }

};
