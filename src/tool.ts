const promise = Promise.resolve();

export const tick = function (method: (any: any) => any) {
    return promise.then(method);
};

export const parseable = function (value: any) {
    return !isNaN(value) && value !== undefined && typeof value !== 'string';
};

export const display = function (data: any) {
    if (typeof data == 'string') return data;
    if (typeof data == 'undefined') return '';
    if (typeof data == 'object') return JSON.stringify(data);
    return data;
};

export const dash = function (data: string) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
};

export default Object.freeze({
    checked: Symbol('checked'),
    parent: Symbol('parent'),
    value: Symbol('value'),
    parseable,
    display,
    dash,
    tick,
});
