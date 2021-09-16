
const isString = '\'`"';
const isNumber = /^[0-9]+$/;
// const isNumber = '0123456789';
const referenceConnector = '.[]';
const referenceStart = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const referenceInner = '_$0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const referenceFirstSkips = [
    '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    'window', 'document', 'console', 'location',
    'Math', 'Date', 'Number', 'Object', 'Array', 'String', 'Boolean', 'Promise', 'Infinity',
    'this', 'true', 'false', 'null', 'undefined', 'NaN', 'of', 'in', 'do', 'if', 'for',
    'var', 'let', 'const',
    'new', 'try', 'case', 'else', 'with', 'await', 'break', 'catch', 'class',
    'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'return', 'switch', 'default',
    'extends', 'finally', 'continue', 'debugger', 'function', 'arguments', 'typeof', 'instanceof', 'void'
];

const parse = function (data, rewrites?: string[][]) {

    let inString = false;
    let inSyntax = false;
    let inReference = false;
    let skipReference = false;

    let part = '';
    let first = '';
    let reference = '';

    // const assignees = [];
    // const references = [];
    const assignees = new Set();
    const references = new Set();

    data = data.replace(/\s*[?+-]?\s*(\.|=)\s*/g, '$1');

    let current, next, previous;

    for (let i = 0, l = data.length; i < l; i++) {

        current = data[ i ];
        next = data[ i + 1 ];
        previous = data[ i - 1 ];

        if (inString && first === current && previous !== '\\') {
            inString = false;
            first = '';
        } else if (!inString && isString.includes(current)) {
            inString = true;
            first = current;

            if (skipReference || !part || !reference && !part) {
                inReference = false;
                skipReference = false;
                reference = part = '';
                continue;
            }

            inReference = false;
            if (!reference && referenceFirstSkips.includes(part)) {
                reference = part = '';
            } else {
                if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                reference += (reference ? '.' + part : part);
                // if (!isNumber.test(reference)) references.push(reference);
                if (!isNumber.test(reference)) references.add(reference);
                reference = part = '';
            }

        } else if (inString) {
            continue;
        } else if (!inSyntax && current === '{' && next === '{') {
            inSyntax = true;
            i++;
        } else if (inSyntax && current === '}' && next === '}') {
            inSyntax = false;

            if (skipReference || !part || !reference && !part) {
                inReference = false;
                skipReference = false;
                reference = part = '';
                continue;
            }

            inReference = false;
            if (!reference && referenceFirstSkips.includes(part)) {
                reference = part = '';
            } else {
                if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                reference += (reference ? '.' + part : part);
                // if (!isNumber.test(reference)) references.push(reference);
                if (!isNumber.test(reference)) references.add(reference);
                reference = part = '';
            }

            i++;
        } else if (inSyntax) {

            if (inReference) {

                if (referenceConnector.includes(current)) {
                    // if ((current === '?' && next === '.') || referenceConnector.includes(current)) {

                    if (skipReference || !part || !reference && !part) continue;

                    if (!reference && referenceFirstSkips.includes(part)) {
                        skipReference = true;
                        part = '';
                    } else {
                        if (rewrites && !reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        reference += (reference ? '.' + part : part);
                        part = '';
                    }

                } else if (referenceInner.includes(current)) {
                    part += current;
                } else {

                    if (skipReference || !part || !reference && !part) {
                        inReference = false;
                        skipReference = false;
                        reference = part = '';
                        continue;
                    }

                    inReference = false;
                    if (part === 'of' || part === 'in') {
                        // references.length = 0;
                        references.clear();
                        reference = part = '';
                    } else if (!reference && referenceFirstSkips.includes(part)) {
                        skipReference = true;
                        reference = part = '';
                    } else {
                        if (rewrites && reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        reference += (reference ? '.' + part : part);

                        if (!isNumber.test(reference)) {
                            // references.push(reference);
                            // if (current === '=' && next !== '=') assignees.push(reference);
                            references.add(reference);
                            if (current === '=' && next !== '=') assignees.add(reference);
                        }

                        reference = part = '';
                    }

                }

            } else {
                if (referenceStart.includes(current)) {
                    inReference = true;
                    part += current;
                }
            }

        }

    };

    // console.log(data, references, assignees);

    return { references, assignees };
};


// const matchAssignee = /([a-zA-Z0-9$_.]+)\s*[!%^&*+|/<>-]*=\s*[^=>]/;

// const replaceEndBracket = /\s*\][^;]*/g;
// const removeStrings = /".*?[^\\]*"|'.*?[^\\]*\'|`.*?[^\\]*`/g;
// const normalizeReference = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
// const replaceOutside = /[^{}]*{{.*?\s+of\s+|[^{}]*{{|}}[^{}]*/g;
// const replaceSeperator = /\s+|\|+|\/+|\(+|\)+|\[+|\^+|\?+|\*+|\++|{+|}+|<+|>+|-+|=+|!+|&+|:+|~+|%+|,+/g; // \]+

// const replaceProtected = new RegExp([
//     `;(
//         [0-9]+|
//         \\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
//         this|window|document|console|location|Object|Array|Math|Date|Number|String|Boolean|Promise|
//         true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
//         yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void
//     )[^;]*;`,
// ].join('').replace(/\s|\t|\n/g, ''), 'g');

// const cache = new Map();

// const parse = function (data) {
//     let result = cache.get(data);
//     if (result) return result;

//     result = {};
//     cache.set(data, result);

//     data = data.replace(replaceOutside, ';');
//     data = data.replace(removeStrings, '');
//     data = data.replace(normalizeReference, '.$2');

//     const assignee = data.match(matchAssignee)?.[ 1 ];

//     data = data.replace(replaceSeperator, ';');
//     data = data.replace(replaceEndBracket, ';');

//     // if (rewrites) {
//     //     for (const [ name, value ] of rewrites) {
//     //         data = data.replace(new RegExp(`;(${name})\\b`, 'g'), `;${value}`);
//     //     }
//     // }

//     data = data.replace(replaceProtected, ';');

//     result.references = data.split(/;+/).slice(1, -1) || [];
//     result.assignees = assignee ? [ assignee ] : [];

//     return result;
// };



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

// const parse = function (value, compute, rewrites) {

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

export default parse;

