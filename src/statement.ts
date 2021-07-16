import traverse from './traverse';

const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
const replaceOutsideAndSyntax = /[^{}]*{{|}}[^{}]*/g;

const reference = '([a-zA-Z_$\\[\\]][a-zA-Z_$0-9]*|\\s*("|`|\'|{|}|\\?\\s*\\.|\\.|\\[|\\])\\s*)';
const references = new RegExp(`${reference}+(?!.*\\1)`, 'g');
const matchAssignment = /([a-zA-Z0-9$_.'`"\[\]]+)\s*=([^=]+|$)/;

const strips = new RegExp([
    ';|:',
    '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`', // strings
    `(window|document|this|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${reference}*`, // globals and specials
    `\\btrue\\b|\\bfalse\\b|\\bnull\\b|\\bundefined\\b|\\bNaN\\b|\\bof\\b|\\bin\\b|
    \\bdo\\b|\\bif\\b|\\bfor\\b|\\blet\\b|\\bnew\\b|\\btry\\b|\\bvar\\b|\\bcase\\b|\\belse\\b|\\bwith\\b|\\bawait\\b|
    \\bbreak\\b|\\bcatch\\b|\\bclass\\b|\\bconst\\b|\\bsuper\\b|\\bthrow\\b|\\bwhile\\b|\\byield\\b|\\bdelete\\b|
    \\bexport\\b|\\bimport\\b|\\breturn\\b|\\bswitch\\b|\\bdefault\\b|\\bextends\\b|\\bfinally\\b|\\bcontinue\\b|
    \\bdebugger\\b|\\bfunction\\b|\\barguments\\b|\\btypeof\\b|\\bvoid\\b`,
].join('|').replace(/\s|\t|\n/g, ''), 'g');

// const ignores = [ '$f', '$e', '$v', '$c', '$form', '$event', '$value', '$checked' ];

const cache = new Map();

export default function (statement: string, data: any, dynamics?: any, rewrites?: any) {

    if (isOfIn.test(statement)) {
        statement = statement.replace(replaceOfIn, '{{$2}}');
    }

    const convert = !shouldNotConvert.test(statement);
    let striped = statement;

    if (rewrites) {
        for (const [ pattern, value ] of rewrites) {
            striped = striped.replace(pattern, (s, g1, g2, g3) => g1 + value + g3);
        }
    }

    striped = striped.replace(replaceOutsideAndSyntax, ' ').replace(strips, '');

    const paths = striped.match(references) || [];

    dynamics = dynamics || {};
    const context = new Proxy(data, {
        has: (_, key) => {
            return true;
        },
        set: (_, key, value) => {
            if (key[ 0 ] === '$') dynamics[ key ] = value;
            else data[ key ] = value;
            return true;
        },
        get: (_, key) => {
            // console.log(data.$path, data[ key ]?.$path, key);
            if (key in dynamics) return dynamics[ key ];
            else if (key in data) return data[ key ];
            else return window[ key ];
        }
    });

    let [ , assignment ] = striped.match(matchAssignment) || [];
    assignment = assignment?.replace(/\s/g, '');
    // assignment = assignment ? `with ($context) { return (${assignment}); }` : undefined;
    // const assignee = assignment ? () => new Function('$context', assignment)(data) : () => undefined;
    const assignee = assignment ? traverse.bind(null, context, assignment) : () => undefined;

    let compute;
    if (cache.has(statement)) {
        compute = cache.get(statement).bind(null, context);
    } else {
        let code = statement;
        code = code.replace(/{{/g, convert ? `' +` : '');
        code = code.replace(/}}/g, convert ? ` + '` : '');
        code = convert ? `'${code}'` : code;
        code = `
            if ($render) {
                $context.$f = $render.form; $context.$form = $render.form;
                $context.$e = $render.event; $context.$event = $render.event;
                $context.$v = $render.value; $context.$value = $render.value;
                $context.$c = $render.checked; $context.$checked = $render.checked;
            }
            with ($context) {
                return (${code});
            }
        `;
        compute = new Function('$context', '$render', code);
        cache.set(statement, compute);
        compute = compute.bind(null, context);
    }

    return { compute, assignee, paths };
};

// 'true', 'false', 'null', 'undefined', 'NaN', 'of', 'in',
//     'do', 'if', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'with', 'await',
//     'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete',
//     'export', 'import', 'return', 'switch', 'default', 'extends', 'finally', 'continue',
//     'debugger', 'function', 'arguments', 'typeof', 'void';

// const $string = 'string';
// const $number = 'number';
// const $variable = 'variable';
// const $function = 'function';

// type Node = {
//     type?: string,
//     parent?: Node,
//     value?: string,
//     children?: any[],
//     compute?: () => any,
// };

// const set = function (path: string, data: object, value: any) {
//     const keys = path.split(/\.|\[|\]/);
//     const l = keys.length;
//     for (let i = 0; i < l; i++) {
//         const key = keys[ i ];
//         const next = keys[ i + 1 ];
//         if (next) {
//             if (!(key in data)) {
//                 data[ key ] = /[0-9]+/.test(next) ? [] : {};
//             }
//             data = data[ key ];
//         } else {
//             return data[ key ] = value;
//         }
//     }
// };

// const get = function (data: object, path: string | string[]) {
//     const keys = typeof path === 'string' ? path.split(/\.|\[|\]/) : path;

//     if (!keys.length) {
//         return data;
//     } else if (typeof data !== 'object') {
//         return undefined;
//     } else {
//         return get(data[ keys[ 0 ] ], keys.slice(1));
//     }
// };

// const finish = function (node, data, tree, assignment?: string) {

//     if (node.type !== $string) node.value = node.value.replace(/\s*/g, '');
//     if (node.value === 'NaN') {
//         node.type = 'nan';
//         node.compute = () => NaN;
//     } else if (node.value === 'null') {
//         node.type = 'null';
//         node.compute = () => null;
//     } else if (node.value === 'true') {
//         node.type = 'boolean';
//         node.compute = () => true;
//     } else if (node.value === 'false') {
//         node.type = 'boolean';
//         node.compute = () => false;
//     } else if (node.value === 'undefined') {
//         node.type = 'undefined';
//         node.compute = () => undefined;
//     } else if (node.type === $number) {
//         node.compute = () => Number(node.value);
//     } else if (node.type === $string) {
//         node.compute = () => node.value;
//     } else if (node.type === $function) {
//         tree.paths.push(node.value);
//         node.compute = (context, ...args) => {
//             if (assignment) {
//                 return set(assignment, data, get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args)));
//             } else {
//                 return get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args));
//             }
//         };
//     } else {
//         node.type = $variable;
//         tree.paths.push(node.value);
//         node.compute = (alternate) => {

//             console.log(assignment, alternate, node, data);

//             const result =
//                 node.value.startsWith('$e') || node.value.startsWith('$event') ||
//                     node.value.startsWith('$v') || node.value.startsWith('$value')
//                     ? get(alternate, node.value.slice(1)) : get(data, node.value);

//             if (assignment) {
//                 // console.log(set(assignment, data, result));
//                 return set(assignment, data, result);
//             }

//             return result;
//         };
//         // node.compute = (value) => {
//         //     return value === undefined ? get(data, node.value) : value;
//         // };
//     }
// };

// const assignmentPattern = /{{((\w+\s*(\.|\[|\])?\s*)+)=.+}}/;
// export default function statement (expression, data) {
//     const tree = { type: 'tree', children: [], paths: [], value: null, parent: null, compute: null };

//     let inside = false;
//     let node: Node = { value: '', parent: tree, children: [] };

//     // each of/in fix
//     expression = expression.replace(/{{.*\s+(of|in)\s+/, '{{');

//     // assignment handle
//     let assignment;
//     if (expression.includes('=')) {
//         assignment = expression.replace(assignmentPattern, '$1').replace(/\s*/g, '');
//         tree.assignee = () => get(data, assignment);
//         expression = expression.replace(/{{.*?=/, '{{');
//     }

//     for (let i = 0; i < expression.length; i++) {
//         const c = expression[ i ];
//         const next = expression[ i + 1 ];
//         const previous = expression[ i - 1 ];

//         if (
//             inside === false &&
//             c === '{' && next === '{'
//         ) {
//             i++;

//             if (node.value) {
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//             }

//             inside = true;
//             node = { value: '', parent: node.parent };
//         } else if (
//             inside === true &&
//             c === '}' && next === '}'
//         ) {
//             i++;

//             if (node.value) {
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//             }

//             inside = false;
//             node = { value: '', parent: node.parent };
//         } else if (inside === false) {
//             node.value += c;
//             node.type = $string;
//         } else if (/'|`| "/.test(c) && !node.type || node.type === $string) {
//             node.type = $string;
//             node.value += c;

//             if (node.value.length > 1 && node.value[ 0 ] === c && previous !== '\\') {
//                 node.value = node.value.slice(1, -1);
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//                 node = { value: '', parent: node.parent };
//             }

//         } else if (/[0-9.]/.test(c) && !node.type || node.type === $number) {
//             node.type = $number;
//             node.value += c;

//             if (!/[0-9.]/.test(next)) {
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//                 node = { value: '', parent: node.parent };
//             }

//         } else if (',' === c) {
//             if (node.value) {
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//                 node = { value: '', parent: node.parent };
//             }
//         } else if ('(' === c) {
//             node.children = [];
//             node.type = $function;
//             finish(node, data, tree, assignment);
//             node.parent.children.push(node);
//             node = { value: '', parent: node };
//         } else if (')' === c) {
//             if (node.value) {
//                 finish(node, data, tree, assignment);
//                 node.parent.children.push(node);
//             }
//             node = { value: '', parent: node.parent.parent };
//         } else if (/\s/.test(c)) {
//             continue;
//         } else if (/[a-zA-Z$_]/.test(c) && !node.type || node.type === $variable) {
//             node.type = $variable;
//             node.value += c;
//         } else {
//             node.value += c;
//         }

//     }

//     if (node.type) {
//         node.compute = function (value) { return value; }.bind(null, node.value);
//         tree.children.push(node);
//     }

//     if (tree.children.length === 1) {
//         tree.compute = (...args) => tree.children[ 0 ].compute(...args);
//     } else {
//         tree.compute = (...args) => tree.children.map(child => child.compute(...args)).join('');
//     }

//     return tree;
// };

// start: test
// const m = {
//     n1: 1,
//     n: { n2: 2 },

//     w: 'world',

//     foo: 'sFoo',
//     bar: 'sBar',
//     one: (two, oneDotTwo, blue) => `sOne ${two} ${oneDotTwo + 2} ${blue}`,
//     two: (foo, three) => `sTwo ${foo} ${three}`,
//     three: (bar, helloWorld) => `sThree ${bar} ${helloWorld + 's'}`,
// };

// console.log(expression(`hello {{w}}.`, m)());
// console.log(expression(`{{n1}}`, m)());
// console.log(expression(`{{n.n2}}`, m)());
// console.log(expression(`{{one(two(foo, three(bar, 'hello world')), 1.2)}}`, m)('blue'));
//end: test
