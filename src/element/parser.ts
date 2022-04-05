
const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;

const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
    '((?:^|}}).*?{{)',
    '(}}.*?(?:{{|$))',
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
        (?:[.][a-zA-Z0-9$_.? ]*\\b)
    )`,
    '(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)' // reference
    //(?:[.][a-zA-Z0-9$_.?\\[\\]]*|\\b)
    //'([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)' // reference
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const cache = new Map();

const parser = function (data) {

    // if (rewrites) {
    //     for (const [ name, value ] of rewrites) {
    //         data = data.replace(name, `$1${value}`);
    //     }
    // }

    const cached = cache.get(data);
    if (cached) return cached;

    data = data.replace(normalizeReference, '.$2');

    const references = [];
    cache.set(data, references);

    let match;
    while (match = referenceMatch.exec(data)) {
        let reference = match[ 5 ];
        if (reference) {
            references.push(reference);
        }
    }

    console.log(data, references);

    return references;
};

export default parser;

