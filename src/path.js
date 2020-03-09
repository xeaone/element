
let BASE;

const setup = async function (option) {
    option = option || {};

    if (option.base) {
        BASE = window.document.querySelector('base');

        if (!BASE) {
            BASE = window.document.createElement('base');
            window.document.head.insertBefore(BASE, window.document.head.firstElementChild);
        }

        BASE.href = option.base;
    }

};

const base = function () {
    if (!BASE) BASE = window.document.querySelector('base');
    if (BASE) return BASE.href;
    return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
};

const extension = function (data) {
    const position = data.lastIndexOf('.');
    return position > 0 ? data.slice(position + 1) : '';
};

const resolve  = function () {
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
};

export default Object.freeze({
    setup, base, extension, resolve
});
