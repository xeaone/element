
const $string = 'string';
const $number = 'number';
const $variable = 'variable';
const $function = 'function';

type Node = {
    type?: string,
    parent?: Node,
    value?: string,
    children?: any[],
    execute?: () => any,
};

const traverse = function (data, paths) {
    paths = typeof paths === 'string' ? paths.split(/\.|\[|\]/) : paths;

    if (!paths.length) {
        return data;
    } else if (typeof data !== 'object') {
        return undefined;
    } else {
        return traverse(data[ paths[ 0 ] ], paths.slice(1));
    }
};

const finish = function (node, data) {
    if (node.value === 'NaN') {
        node.type = 'nan';
        node.execute = () => NaN;
    } else if (node.value === 'null') {
        node.type = 'null';
        node.execute = () => null;
    } else if (node.value === 'true') {
        node.execute = () => true;
        node.type = 'boolean';
    } else if (node.value === 'false') {
        node.type = 'boolean';
        node.execute = () => false;
    } else if (node.value === 'undefined') {
        node.type = 'undefined';
        node.execute = () => undefined;
    } else if (node.type === $number) {
        node.execute = () => Number(node.value);
    } else if (node.type === $string) {
        node.execute = () => node.value;
    } else if (node.type === $function) {
        node.execute = (...args) => traverse(data, node.value)(...node.children.map(child => child.execute(...args)), ...args);
    } else {
        node.type = $variable;
        node.execute = () => traverse(data, node.value);
    }
};

export default function expression (expression, data) {
    const tree = { type: 'tree', children: [], value: null, parent: null };

    let inside = false;
    let node: Node = { value: '', parent: tree, children: [] };

    for (let i = 0; i < expression.length; i++) {
        const c = expression[ i ];
        const next = expression[ i + 1 ];
        const previous = expression[ i - 1 ];

        if (
            inside === false &&
            c === '{' && next === '{'
        ) {
            i++;

            if (node.value) {
                finish(node, data);
                node.parent.children.push(node);
            }

            inside = true;
            node = { value: '', parent: node.parent };
        } else if (
            inside === true &&
            c === '}' && next === '}'
        ) {
            i++;

            if (node.value) {
                finish(node, data);
                node.parent.children.push(node);
            }

            inside = false;
            node = { value: '', parent: node.parent };
        } else if (inside === false) {
            node.value += c;
            node.type = $string;
        } else if (/'|`|"/.test(c) && !node.type || node.type === $string) {
            node.type = $string;
            node.value += c;

            if (node.value.length > 1 && node.value[ 0 ] === c && previous !== '\\') {
                node.value = node.value.slice(1, -1);
                finish(node, data);
                node.parent.children.push(node);
                node = { value: '', parent: node.parent };
            }

        } else if (/[0-9.]/.test(c) && !node.type || node.type === $number) {
            node.type = $number;
            node.value += c;

            if (!/[0-9.]/.test(next)) {
                finish(node, data);
                node.parent.children.push(node);
                node = { value: '', parent: node.parent };
            }

        } else if (',' === c) {
            if (node.value) {
                finish(node, data);
                node.parent.children.push(node);
                node = { value: '', parent: node.parent };
            }
        } else if ('(' === c) {
            node.children = [];
            node.type = $function;
            finish(node, data);
            node.parent.children.push(node);
            node = { value: '', parent: node };
        } else if (')' === c) {
            if (node.value) {
                finish(node, data);
                node.parent.children.push(node);
            }
            node = { value: '', parent: node.parent.parent };
        } else if (/\s/.test(c)) {
            continue;
        } else if (/[a-zA-Z$_]/.test(c) && !node.type || node.type === $variable) {
            node.type = $variable;
            node.value += c;
        } else {
            node.value += c;
        }

    }

    if (node.type) {
        node.execute = function (value) { return value; }.bind(null, node.value);
        tree.children.push(node);
    }

    if (tree.children.length === 1) {
        return (...args) => tree.children[ 0 ].execute(...args);
    } else {
        return (...args) => tree.children.map(child => child.execute(...args)).join('');
    }

};

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
