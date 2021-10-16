
const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;

// const replaceEndBracket = /\s*\][^;]*/g;
// const replaceString = /".*?[^\\]*"|'.*?[^\\]*\'|`.*?[^\\]*`/g;
// const replaceOutside = /[^{}]*{{.*?\s+of\s+|[^{}]*{{|}}[^{}]*/g;
// const replaceSeperator = /\s+|\|+|\/+|\(+|\)+|\[+|\^+|\?+|\*+|\++|{+|}+|<+|>+|-+|=+|!+|&+|:+|~+|%+|,+/g; // \]+

// const replaceProtected = new RegExp([
//     replaceString.source,
//     replaceOutside.source,
//     replaceEndBracket.source,
//     replaceSeperator.source,
//     `(
//         \\d+\\.\\d*|\\d*\\.\\d+|\\d+|
//         \\$assignee|\\$instance|\\$binder|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
//         this|window|document|console|location|
//         globalThis|Infinity|NaN|undefined|
//         isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
//         Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
//         Object|Function|Boolean|Symbole|Array|
//         Number|Math|Date|BigInt|
//         String|RegExp|
//         Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
//         Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
//         Map|Set|WeakMap|WeakSet|
//         ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
//         Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
//         Reflect|Proxy|
//         true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
//         yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void
//     )\\b`,
// ].join('|').replace(/\s|\t|\n/g, ''), 'g');

// const replaceProtected = new RegExp([
//     `;(
//         \\d+\\.\\d*|\\d*\\.\\d+|\\d+|
//         \\$assignee|\\$instance|\\$binder|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
//         this|window|document|console|location|
//         globalThis|Infinity|NaN|undefined|
//         isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
//         Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
//         Object|Function|Boolean|Symbole|Array|
//         Number|Math|Date|BigInt|
//         String|RegExp|
//         Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
//         Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
//         Map|Set|WeakMap|WeakSet|
//         ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
//         Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
//         Reflect|Proxy|
//         true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
//         yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void
//     )[^;]*;`,
// ].join('').replace(/\s|\t|\n/g, ''), 'g');

const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
    '([^{}]*{{.*?\\s+(?:of|in)\\s+)', // of in
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
    '([a-zA-Z$_][a-zA-Z0-9$_.?\\[\\]]*)' // reference
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const cache = new Map();

const parser = function (data, rewrites) {

    if (!rewrites?.length) {
        const cached = cache.get(data);
        if (cached) return cached;
    }

    const references = [];
    cache.set(data, references);
    data = data.replace(normalizeReference, '.$2');

    // let result = { references: undefined };
    // cache.set(data, result);
    // data = data.replace(replaceOutside, ';');
    // data = data.replace(replaceString, '');
    // data = data.replace(normalizeReference, '.$2');
    // data = data.replace(replaceSeperator, ';');
    // data = data.replace(replaceEndBracket, ';');
    // data = data.replace(replaceProtected, ';');
    // if (rewrites) {
    //     for (const [ name, value ] of rewrites) {
    //         data = data.replace(name, `;${value}`);
    //     }
    // }
    // result.references = data.split(/;+/).slice(1, -1) || [];

    let match;
    while (match = referenceMatch.exec(data)) {
        let reference = match[ 4 ];
        if (reference) {

            if (rewrites) {
                for (const [ name, value ] of rewrites) {
                    reference = reference.replace(name, `${value}`);
                }
            }

            references.push(reference);
        }
    }

    // console.log(references);
    return references;
};



export default parser;

