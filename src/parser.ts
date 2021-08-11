
const isString = '\'`"';
const isNumber = /^[0-9]+$/;
const referenceConnector = '.[]';
const referenceStart = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const referenceInner = '_$0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const referenceFirstSkips = [
    '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    'window', 'document', 'console', 'location', 'Math', 'Date', 'Number',
    'this', 'true', 'false', 'null', 'undefined', 'NaN', 'of', 'in', 'do', 'if', 'for', 'let',
    'new', 'try', 'var', 'case', 'else', 'with', 'await', 'break', 'catch', 'class', 'const',
    'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'return', 'switch', 'default',
    'extends', 'finally', 'continue', 'debugger', 'function', 'arguments', 'typeof', 'void'
];

const parse = function (data, rewrites?: string[][]) {

    let inString = false;
    let inSyntax = false;
    let inReference = false;
    let skipReference = false;

    let part = '';
    let first = '';
    let reference = '';

    const assignees = [];
    const references = [];

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
                if (!isNumber.test(reference)) references.push(reference);
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
                if (!isNumber.test(reference)) references.push(reference);
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
                        references.length = 0;
                        reference = part = '';
                    } else if (!reference && referenceFirstSkips.includes(part)) {
                        skipReference = true;
                        reference = part = '';
                    } else {
                        if (rewrites && reference) for (const [ name, value ] of rewrites) part === name ? part = value : null;
                        reference += (reference ? '.' + part : part);

                        if (!isNumber.test(reference)) {
                            references.push(reference);
                            if (current === '=' && next !== '=') assignees.push(reference);
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

    return { references, assignees };
};

// const connectorReference = '\\s*\\??\\s*\\.?\\s*\\[\\s*|\\s*\\]\\s*\\??\\s*\\.?\\s*|\\s*\\??\\s*\\.\\s*';
// const startReference = '[a-zA-Z_$]+';
// const endReference = `((${connectorReference})[a-zA-Z_$0-9]+)*`;

// const replaceReferenceConnector = new RegExp(`${connectorReference}`, 'g');
// const allReferences = new RegExp(`${startReference}${endReference}`, 'g');

// const replaceReferenceSeperator = new RegExp([
//     '^[^}}]*{{|}}.*?{{|}}[^{{]*$',
//     '[!?+\\-()=]+'
// ].join('|'), 'g');

// const strips = new RegExp([
//     '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`', // strings
//     '(var|let|const)\\s+[_$a-zA-Z0-9]+\\s*=?', // variables
//     `(window|document|this|Math|Date|Number|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${endReference}`, // globals and specials
//     `\\btrue\\b|\\bfalse\\b|\\bnull\\b|\\bundefined\\b|\\bNaN\\b|\\bof\\b|\\bin\\b|
//     \\bdo\\b|\\bif\\b|\\bfor\\b|\\bnew\\b|\\btry\\b|\\bcase\\b|\\belse\\b|\\bwith\\b|\\bawait\\b|
//     \\bbreak\\b|\\bcatch\\b|\\bclass\\b|\\bsuper\\b|\\bthrow\\b|\\bwhile\\b|\\byield\\b|\\bdelete\\b|
//     \\bexport\\b|\\bimport\\b|\\breturn\\b|\\bswitch\\b|\\bdefault\\b|\\bextends\\b|\\bfinally\\b|\\bcontinue\\b|
//     \\bdebugger\\b|\\bfunction\\b|\\barguments\\b|\\btypeof\\b|\\bvoid\\b`,
// ].join('|').replace(/\s|\t|\n/g, ''), 'g');

// const parse = function (data, rewrites?: string[][]) {

//     const assignee = data.replace(/{{.*?(\w+)\s*=[^=]*}}/, '$1');

//     data = data.replace(strips, '').replace(replaceReferenceConnector, '.').replace(replaceReferenceSeperator, ';');

//     if (rewrites) {
//         for (const [ name, value ] of rewrites) {
//             data = data.replace(new RegExp(`;(${name})\\b`), value);
//         }
//     }

//     const references = data.match(allReferences) || [ '' ];

//     // console.log(references, assignee);

//     return { references, assignee };
// };

export default parse;

