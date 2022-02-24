
const computerCache = new Map();
// const ignores = [
//     '$instance', '$event', '$value', '$checked', '$form',
//     'this', 'window', 'document', 'console', 'location',
//     'globalThis', 'Infinity', 'NaN', 'undefined',
//     'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent ',
//     'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError', 'AggregateError',
//     'Object', 'Function', 'Boolean', 'Symbole', 'Array',
//     'Number', 'Math', 'Date', 'BigInt',
//     'String', 'RegExp',
//     'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
//     'Int32Array', 'Uint32Array', 'BigInt64Array', 'BigUint64Array', 'Float32Array', 'Float64Array',
//     'Map', 'Set', 'WeakMap', 'WeakSet',
//     'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics', 'JSON',
//     'Promise', 'GeneratorFunction', 'AsyncGeneratorFunction', 'Generator', 'AsyncGenerator', 'AsyncFunction',
//     'Reflect', 'Proxy',
// ];

// const has = function (target, key) {
//     return ignores.includes(key) ? false : key in target;
// };

const computer = function (data, scope, alias) {
    let cache = computerCache.get(data);
    // if (cache) return cache.bind(null, new Proxy(scope, { has }), alias || {});
    if (cache) return cache.bind(null, scope, alias || {});

    const code = `
        try {
            $instance = $instance || { $value:undefined, $checked:undefined, $event:undefined, $form:undefined };
            with ($instance) {
                with ($scope) {
                    with ($alias) {
                        return ${data};
                    }
                }
            }
        } catch (error){
            console.error(error);
        }
    `;

    cache = new Function('$scope', '$alias', '$instance', code);
    // cache = new Function('$scope', '$alias', '$instance', code).bind(null, new Proxy(scope, { has }));
    computerCache.set(data, cache);

    return cache.bind(null, scope, alias || {});
    // return cache.bind(null, new Proxy(scope, { has }), alias || {});
};

export default computer;