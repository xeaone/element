// const ContextApply = function (target: ContextTarget, receiver: ContextReceiver, args: any[]) {
//     return Reflect.apply(target, receiver, args);
// };
var ContextSet = function (method, target, key, value, receiver) {
    if (typeof key === 'symbol')
        return Reflect.set(target, key, value, receiver);
    var from = Reflect.get(target, key, receiver);
    if (from === value)
        return true;
    if (Number.isNaN(from) && Number.isNaN(value))
        return true;
    Reflect.set(target, key, value, receiver);
    method();
    return true;
};
var ContextGet = function (method, target, key, receiver) {
    if (typeof key === 'symbol')
        return Reflect.get(target, key, receiver);
    var value = Reflect.get(target, key, receiver);
    if (value) {
        if (value.constructor === Function) {
            // if (typeof value == 'function') {
            return new Proxy(value, {
                apply: function (t, _, a) {
                    return Reflect.apply(t, receiver, a);
                }
            });
        }
        if (value.constructor === Object || value.constructor === Array) {
            // if (typeof value == 'object') {
            return new Proxy(value, {
                get: ContextGet.bind(null, method),
                set: ContextSet.bind(null, method),
                deleteProperty: ContextDelete.bind(null, method),
            });
        }
    }
    return value;
};
var ContextDelete = function (method, target, key) {
    if (typeof key === 'symbol')
        return Reflect.deleteProperty(target, key);
    Reflect.deleteProperty(target, key);
    method();
    return true;
};
var Context = function (data, method) {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method),
    });
};
export default Context;
