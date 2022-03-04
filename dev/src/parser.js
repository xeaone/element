
const bindingCache = new Map();
const bindingMatch = /([a-zA-Z$_][a-z0-9A-Z$_]+)\s*:\s*([^,\[\]]+|.*?{.*?}.*?|.*?\[.*?\].*?|.*?\(.*?\).*?)\s*(?:,|$)/g;

const referenceCache = new Map();
const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;

const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
    `(
        (?:\\$assignment|\\$instance|\\$form|\\$event|\\$value|\\$checked|
            this|window|document|console|location|
            globalThis|Infinity|NaN|undefined|
            isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
            Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
            Object|Function|Boolean|Symbole|Array|
            Number|Math|Date|BigInt|
            String|RegExp|
            Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
            Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
            Map|Set|WeakMap|WeakSet|
            ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
            Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
            Reflect|Proxy|
            true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
            yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
        [a-zA-Z0-9$_.?\\[\\]]*
    )`, // specials
    '([a-zA-Z$_][a-zA-Z0-9$_.?]*)' // reference
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const referenceParse = function (data, rewrites) {

    data = data.replace(normalizeReference, '.$2');

    if (rewrites) {
        for (const [ name, value ] of rewrites) {
            data = data.replace(name, value);
        }
    }

    const key = data;
    const cache = referenceCache.get(key);
    if (cache) return cache;

    const references = [];
    referenceCache.set(key, references);

    let match;
    while (match = referenceMatch.exec(data)) {
        const reference = match[ 3 ];
        if (reference) references.push(reference);
    }

    return references;
};

const parser = function (data, rewrites) {

    const key = data;
    const cache = bindingCache.get(key);
    if (cache) return cache;

    const results = [];
    bindingCache.set(key, results);

    console.log(
        data.match(bindingMatch)
    );

    let match;
    while (match = bindingMatch.exec(data)) {
        const name = match[ 1 ], value = match[ 2 ];
        const references = referenceParse(value, rewrites);
        results.push({ name, value, references });
    }

    return results;
};

export default parser;