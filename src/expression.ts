
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
//         console.log('push', node.value);
//         tree.paths.push(node.value);
//         node.compute = (context, ...args) => {
//             if (assignment) {
//                 return set(assignment, data, get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args)));
//             } else {
//                 return get(data, node.value).call(context, ...node.children.map(child => child.compute(context), ...args));
//             }
//         };
//     } else {
//         console.log(node.value);
//         node.type = $variable;
//         tree.paths.push(node.value);
//         node.compute = (alternate) => {
//             return node.value.startsWith('$e') || node.value.startsWith('$event')
//                 || node.value.startsWith('$v') || node.value.startsWith('$value')
//                 ? get(alternate, node.value) : get(data, node.value);
//         };
//         // node.compute = (value) => {
//         //     return value === undefined ? get(data, node.value) : value;
//         // };
//     }
// };


const prohibited = [
    'true', 'false',
    'do', 'if', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'with', 'await',
    'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete',
    'export', 'import', 'return', 'switch', 'default', 'extends', 'finally', 'continue',
    'debugger', 'function', 'arguments', 'typeof', 'void'
];

const nameIgnores = [ ...prohibited ];
const pathIgnores = [ '$e', '$event', '$v', '$value', ...prohibited ];

export default function (expression, data) {
    const matches = expression.match(/{{.*?}}/g);
    const convert = !expression.trim().startsWith('{{');
    const paths = [];
    const names = [];

    for (let match of matches) {
        match = match.replace(/".*?[^\\]"|'.*?[^\\]'|`.*?[^\\]`/g, '');
        const ps = match.match(/[_$a-zA-Z0-9.\[\]]+/g);
        if (ps) paths.push(...ps.filter(path => !pathIgnores.includes(path)));
        const ns = match.replace(/([_$a-zA-Z0-9]+)[_$a-zA-Z0-9.]*/g, '$1').match(/[_$a-zA-Z0-9]+/g);
        if (ns) names.push(...ns.filter(path => !nameIgnores.includes(path)));
    }

    let code = convert ? `return "${expression}";` : `return ${expression};`;
    const replaceWith = convert ? '" + $1 + "' : '$1';

    matches.forEach(match => code = code.replace(match, match.replace(/{{(.*?)}}/, replaceWith)));

    return {
        paths,
        compute (extra?: object) {
            const values = names.map(name => extra && name in extra ? extra[ name ] : data[ name ]);
            return new Function(...names, code)(...values);
        }
    };
}

// const assignmentPattern = /{{((\w+\s*(\.|\[|\])?\s*)+)=.+}}/;
// export default function expression (expression, data) {
//     const tree = { type: 'tree', children: [], paths: [], value: null, parent: null, compute: null };

//     let inside = false;
//     let node: Node = { value: '', parent: tree, children: [] };

//     // each of/in fix
//     expression = expression.replace(/{{.*\s+(of|in)\s+/, '{{');

//     // assignment handle
//     let assignment;
//     if (expression.includes('=')) {
//         assignment = expression.replace(assignmentPattern, '$1').replace(/\s*/g, '');
//         console.log(assignment);
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
//                 finish(node, data, tree);
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
//                 finish(node, data, tree);
//                 node.parent.children.push(node);
//             }

//             inside = false;
//             node = { value: '', parent: node.parent };
//         } else if (inside === false) {
//             node.value += c;
//             node.type = $string;
//         } else if (/'|`|"/.test(c) && !node.type || node.type === $string) {
//             node.type = $string;
//             node.value += c;

//             if (node.value.length > 1 && node.value[ 0 ] === c && previous !== '\\') {
//                 node.value = node.value.slice(1, -1);
//                 finish(node, data, tree);
//                 node.parent.children.push(node);
//                 node = { value: '', parent: node.parent };
//             }

//         } else if (/[0-9.]/.test(c) && !node.type || node.type === $number) {
//             node.type = $number;
//             node.value += c;

//             if (!/[0-9.]/.test(next)) {
//                 finish(node, data, tree);
//                 node.parent.children.push(node);
//                 node = { value: '', parent: node.parent };
//             }

//         } else if (',' === c) {
//             if (node.value) {
//                 finish(node, data, tree);
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
//                 finish(node, data, tree);
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
