const $string = 'string';
const $number = 'number';
const $variable = 'variable';
const $function = 'function';

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
        node.execute = () => node.value.slice(1, -1);
    } else if (node.type === $function) {
        node.execute = () => traverse(data, node.value)(...node.children.map(child => child.execute()));
    } else {
        node.type = $variable;
        node.execute = () => traverse(data, node.value);
    }
};

export default function expression (expression, data) {
    const tree = { type: 'tree', children: [], value: null, parent: null };

    let inside = false;
    let parent = tree;
    let node = { value: '', parent, children: [] };

    for (let i = 0; i < expression.length; i++) {
        const c = expression[ i ];
        const next = expression[ i + 1 ];

        if (
            inside === true &&
            node.type !== $string &&
            /\s/.test(c)
        ) continue;

        if (
            inside === false &&
            node.type !== $string &&
            c === '{' && next === '{'
        ) {
            i++;

            if (node.value) {
                node.execute = function (value) { return value; }.bind(null, node.value);
                node.parent.children.push(node);
            }

            inside = true;
            node = { value: '', parent };
        } else if (
            inside === true &&
            node.type !== $string &&
            c === '}' && next === '}'
        ) {
            i++;

            node.type = node.type || 'variable';
            node.execute = traverse.bind(null, data, node.value);
            node.parent.children.push(node);

            inside = false;
            node = { value: '', parent };
        } else {
            node.value += c;
        }

        if (inside === false) continue;

        if (
            node.type === $string ||
            (/['`"]/.test(c) && !node.value && !node.type)
        ) {
            node.type = $string;

            if (node.value[ 0 ] === c && expression[ i - 1 ] !== '\\') {
                finish(node, data);
                node.parent.children.push(node);
                node = { value: '', parent };
            }

        } else if (
            node.type === $number ||
            (/[0-9.]/.test(c) && !node.value && !node.type)
        ) {
            node.type = $number;

            if (!/[0-9.]/.test(next)) {
                finish(node, data);
                node.parent.children.push(node);
                node = { value: '', parent };
            }

        } else if (',' === c) {
            finish(node, data);
            node.parent.children.push(node);
            node = { value: '', parent };
        } else if ('(' === c) {
            node.children = [];
            node.type = $function;
            finish(node, data);
            node.parent.children.push(node);
            parent = node;
            node = { value: '', parent };
        } else if (')' === c) {
            finish(node, data);
            node.parent.children.push(node);
            parent = node.parent;
            node = { value: '', parent };
        }

    }

    if (node.type) {
        node.execute = function (value) { return value; }.bind(null, node.value);
        tree.children.push(node);
    }
    console.log(tree);

    if (tree.children.length === 1) {
        return () => tree.children[ 0 ].execute();
    } else {
        return () => tree.children.map(child => child.execute()).join('');
    }

};

// start: test
const m = {
    n1: 1,
    n: { n2: 2 },

    w: 'world',

    foo: 'sFoo',
    bar: 'sBar',
    one: (two, oneDotTwo) => `sOne ${two} ${oneDotTwo + 2}`,
    two: (foo, three) => `sTwo ${foo} ${three}`,
    three: (bar, helloWorld) => `sThree ${bar} ${helloWorld + 's'}`,
};

console.log(expression(`hello {{ w }}.`, m)());

console.log(expression(`{{n1}}`, m)());
// console.log(expression(`{{n.n2}}`, m)());
// console.log(expression(`one(two(foo, three(bar, 'hello world')), 1.2)`, m)());

//end: test

