
const parserCache = new Map();
const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
    // '([^{}]*{{.*?\\s+(?:of|in)\\s+)', // of in
    // '((?:^|}}).*?{{)',
    // '(}}.*?(?:{{|$))',
    '((?:,|{)\\s*\\[a-zA-Z$_][a-zA-Z0-9$_]*\\s*:)',
    `(
        (?:\\$assignee|\\$instance|\\$binder|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
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
    )`,
    // [a-zA-Z0-9$_.?\\[\\]]*
    '([a-zA-Z$_][a-zA-Z0-9$_.?]*)' // reference
    // '([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)' // reference
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const parser = function (data, rewrites) {

    data = data.replace(normalizeReference, '.$2');

    if (rewrites) {
        for (const [ name, value ] of rewrites) {
            data = data.replace(name, `${value}`);
        }
    }

    const cache = parserCache.get(data);
    if (cache) return cache;

    const references = [];
    parserCache.set(data, references);

    let match;
    while (match = referenceMatch.exec(data)) {
        const reference = match[ 4 ];
        // const reference = match[ 6 ];
        if (reference) {
            references.push(reference);
        }
    }

    // console.log(data, references);

    return references;
};

export default parser;