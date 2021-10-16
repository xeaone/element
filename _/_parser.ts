
// const isString = '\'`"';
// const isNumber = /^[0-9]+$/;
// // const isNumber = '0123456789';
// const referenceConnector = '.[]';
// const referenceStart = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// const referenceInner = '_$0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// const referenceFirstSkips = [
//     '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
//     'window', 'document', 'console', 'location',
//     'Math', 'Date', 'Number', 'Object', 'Array', 'String', 'Boolean', 'Promise', 'Infinity',
//     'this', 'true', 'false', 'null', 'undefined', 'NaN', 'of', 'in', 'do', 'if', 'for',
//     'var', 'let', 'const',
//     'new', 'try', 'case', 'else', 'with', 'await', 'break', 'catch', 'class',
//     'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'return', 'switch', 'default',
//     'extends', 'finally', 'continue', 'debugger', 'function', 'arguments', 'typeof', 'instanceof', 'void'
// ];

// const parser = function (data, rewrites?: string[][]) {

//     let inString = false;
//     let inSyntax = false;
//     let inReference = false;
//     let skipReference = false;

//     let part = '';
//     let first = '';
//     let reference = '';

//     // const assignees = [];
//     // const references = [];
//     const assignees = new Set();
//     const references = new Set();

//     data = data.replace(/\s*[?+-]?\s*(\.|=)\s*/g, '$1');

//     let current, next, previous;

//     for (let i = 0, l = data.length; i < l; i++) {

//         current = data[ i ];
//         next = data[ i + 1 ];
//         previous = data[ i - 1 ];

//         if (inString && first === current && previous !== '\\') {
//             inString = false;
//             first = '';
//         } else if (!inString && isString.includes(current)) {
//             inString = true;
//             first = current;

//             if (skipReference || !part || !reference && !part) {
//                 inReference = false;
//                 skipReference = false;
//                 reference = part = '';
//                 continue;
//             }

//             inReference = false;
//             if (!reference && referenceFirstSkips.includes(part)) {
//                 reference = part = '';
//             } else {
//                 if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
//                 reference += (reference ? '.' + part : part);
//                 // if (!isNumber.test(reference)) references.push(reference);
//                 if (!isNumber.test(reference)) references.add(reference);
//                 reference = part = '';
//             }

//         } else if (inString) {
//             continue;
//         } else if (!inSyntax && current === '{' && next === '{') {
//             inSyntax = true;
//             i++;
//         } else if (inSyntax && current === '}' && next === '}') {
//             inSyntax = false;

//             if (skipReference || !part || !reference && !part) {
//                 inReference = false;
//                 skipReference = false;
//                 reference = part = '';
//                 continue;
//             }

//             inReference = false;
//             if (!reference && referenceFirstSkips.includes(part)) {
//                 reference = part = '';
//             } else {
//                 if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
//                 reference += (reference ? '.' + part : part);
//                 // if (!isNumber.test(reference)) references.push(reference);
//                 if (!isNumber.test(reference)) references.add(reference);
//                 reference = part = '';
//             }

//             i++;
//         } else if (inSyntax) {

//             if (inReference) {

//                 if (referenceConnector.includes(current)) {
//                     // if ((current === '?' && next === '.') || referenceConnector.includes(current)) {

//                     if (skipReference || !part || !reference && !part) continue;

//                     if (!reference && referenceFirstSkips.includes(part)) {
//                         skipReference = true;
//                         part = '';
//                     } else {
//                         if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
//                         reference += (reference ? '.' + part : part);
//                         part = '';
//                     }

//                 } else if (referenceInner.includes(current)) {
//                     part += current;
//                 } else {

//                     if (skipReference || !part || !reference && !part) {
//                         inReference = false;
//                         skipReference = false;
//                         reference = part = '';
//                         continue;
//                     }

//                     inReference = false;
//                     if (part === 'of' || part === 'in') {
//                         // references.length = 0;
//                         references.clear();
//                         reference = part = '';
//                     } else if (!reference && referenceFirstSkips.includes(part)) {
//                         skipReference = true;
//                         reference = part = '';
//                     } else {
//                         if (rewrites && reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
//                         reference += (reference ? '.' + part : part);

//                         if (!isNumber.test(reference)) {
//                             // references.push(reference);
//                             // if (current === '=' && next !== '=') assignees.push(reference);
//                             references.add(reference);
//                             if (current === '=' && next !== '=') assignees.add(reference);
//                         }

//                         reference = part = '';
//                     }

//                 }

//             } else {
//                 if (referenceStart.includes(current)) {
//                     inReference = true;
//                     part += current;
//                 }
//             }

//         }

//     };

//     // console.log(data, references, assignees);

//     return { references, assignees };
// };


// const matchAssignee = /([a-zA-Z0-9$_.]+)\s*[!%^&*+|/<>-]*=\s*[^=>]/;
// const replaceEndBracket = /\s*\][^;]*/g;
// const replaceStrings = /".*?[^\\]*"|'.*?[^\\]*\'|`.*?[^\\]*`/g;
// const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
// const replaceOutside = /[^{}]*{{.*?\s+of\s+|[^{}]*{{|}}[^{}]*/g;
// const replaceSeperator = /\s+|\|+|\/+|\(+|\)+|\[+|\^+|\?+|\*+|\++|{+|}+|<+|>+|-+|=+|!+|&+|:+|~+|%+|,+/g; // \]+
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

    let result = { references: undefined };
    cache.set(data, result);

    // data = data.replace(replaceOutside, ';');
    // data = data.replace(replaceStrings, '');
    // data = data.replace(normalizeReference, '.$2');
    // // const assignee = data.match(matchAssignee)?.[ 1 ];
    // data = data.replace(replaceSeperator, ';');
    // data = data.replace(replaceEndBracket, ';');

    const references = [];

    let match;
    while (match = referenceMatch.exec(data)) {
        let reference = match[ 3 ];
        if (reference) {

            if (rewrites) {
                for (const [ name, value ] of rewrites) {
                    reference = reference.replace(name, `${value}`);
                }
            }

            references.push(reference);
        }
    }

    console.log(references);

    // if (rewrites) {
    //     for (const [ name, value ] of rewrites) {
    //         data = data.replace(new RegExp(`;(${name})\\b`, 'g'), `;${value}`);
    //     }
    // }

    // data = data.replace(replaceProtected, ';');
    // result.references = data.split(/;+/).slice(1, -1) || [];
    // // result.assignees = assignee ? [ assignee ] : [];

    result.references = references;

    return result;
};



// const skips = new RegExp([
//     `^(
//         window|document|console|location|
//         Object|Array|Math|Date|Number|String|Boolean|Promise|
//         \\$render|\\$event|\\$value|\\$checked|\\$form|\\$r|\\$e|\\$v|\\$c|\\$f
//     )\\b`,
// ].join('').replace(/\s|\t|\n/g, ''));

// const cache = new Map();
// const has = () => true;

// const set = function (rewrites, sets, gets, path, t, key) {
//     if (typeof key !== 'string') return;

//     path = path ? `${path}.${key}` : `${key}`;

//     if (rewrites) {
//         for (const [ name, value ] of rewrites) {
//             path = path === name ? value : path;
//         }
//     }

//     if (!skips.test(path) && !gets.includes(path)) {
//         gets.push(path);
//     }

//     if (!skips.test(path) && !sets.includes(path)) {
//         sets.push(path);
//     }

//     return true;
// };

// const get = function (rewrites, sets, gets, path, t, key) {
//     if (typeof key !== 'string') return;

//     path = path ? `${path}.${key}` : `${key}`;

//     if (rewrites) {
//         for (const [ name, value ] of rewrites) {
//             path = path === name ? value : path;
//         }
//     }

//     if (!skips.test(path) && !gets.includes(path)) {
//         gets.push(path);
//     }

//     return new Proxy(() => undefined,
//         {
//             has,
//             set: set.bind(null, null, sets, gets, path),
//             get: get.bind(null, null, sets, gets, path),
//         }
//     );
// };

// const parser = function (value, compute, rewrites) {

//     let result = cache.get(value);

//     if (!result) {
//         const sets = [];
//         const gets = [];

//         const context = new Proxy({}, {
//             has,
//             set: set.bind(null, rewrites, sets, gets, ''),
//             get: get.bind(null, rewrites, sets, gets, '')
//         });

//         compute(context);

//         result = { gets, sets };
//         cache.set(value, result);
//     }

//     return result;
// };

export default parser;

