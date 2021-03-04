
export const isMap = (data: any) => data?.constructor === Map;
export const isDate = (data: any) => data?.constructor === Date;
export const isArray = (data: any) => data?.constructor === Array;
export const isString = (data: any) => data?.constructor === String;
export const isNumber = (data: any) => data?.constructor === Number;
export const isObject = (data: any) => data?.constructor === Object;
export const isBoolean = (data: any) => data?.constructor === Boolean;

export const toArray = (data: any) => JSON.parse(data);
export const toObject = (data: any) => JSON.parse(data);
export const toBoolean = (data: any) => data === 'true';
export const toDate = (data: any) => new Date(Number(data));
export const toMap = (data: any) => new Map(JSON.parse(data));
export const toString = (data: any) => typeof data === 'string' ? data : JSON.stringify(data);
export const toNumber = (data: any) => data === '' || typeof data !== 'string' && typeof data !== 'number' ? NaN : Number(data);

export const to = function (source: any, target: any) {
    try {
        if (isMap(source)) return toMap(target);
        if (isDate(source)) return toDate(target);
        if (isArray(source)) return toArray(target);
        if (isString(source)) return toString(target);
        if (isObject(source)) return toObject(target);
        if (isNumber(source)) return toNumber(target);
        if (isBoolean(source)) return toBoolean(target);
    } catch {
        return target;
    }
};

export const toDash = (data: string) => data.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

export const base = function () {
    const base = window.document.querySelector('base');
    if (base) {
        return base.href;
    } else {
        return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
    }
};

export const walker = function (node, callback) {

    callback(node);
    node = node.firstChild;

    while (node) {
        walker(node, callback);
        node = node.nextSibling;
    }

};

export const traverse = function (data: any, paths: string[]) {
    if (paths.length === 0) {
        return data;
    } else if (typeof data !== 'object') {
        return undefined;
    } else {
        return traverse(data[paths[0]], paths.slice(1));
    }
};

export const match = function (source, target) {

    if (source === target) {
        return true;
    }

    const sourceType = typeof source;
    const targetType = typeof target;

    if (sourceType !== targetType) {
        return false;
    }

    if (sourceType !== 'object' || targetType !== 'object') {
        return source === target;
    }

    if (source.constructor !== target.constructor) {
        return false;
    }

    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    if (sourceKeys.length !== targetKeys.length) {
        return false;
    }

    for (let i = 0; i < sourceKeys.length; i++) {
        const name = sourceKeys[i];
        if (!match(source[name], target[name])) return false;
    }

    return true;
};

export const includes = function (items, item) {

    for (let i = 0; i < items.length; i++) {
        if (match(items[i], item)) {
            return true;
        }
    }

    return false;
};

export const index = function (items, item) {

    for (let i = 0; i < items.length; i++) {
        if (match(items[i], item)) {
            return i;
        }
    }

    return -1;
};

// export const events = function (target: Element, name: string, detail?: any, options?: any) {
//     options = options || { detail: null };
//     options.detail = detail === undefined ? null : detail;
//     target.dispatchEvent(new window.CustomEvent(name, options));
// };

// export default function extension (path:string) {
//     const position = path.lastIndexOf('.');
//     return position > 0 ? path.slice(position + 1) : '';
// }

// export default function normalize (path:string) {
//     return path
//         .replace(/\/+/g, '/')
//         .replace(/\/$/g, '')
//         || '.';
// }



