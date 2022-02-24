const $string = 'string';
const $number = 'number';
const $binder = 'binder';
const $variable = 'variable';
const $function = 'function';

// const traverse = function (data, paths) {
//     paths = typeof paths === 'string' ? paths.split(/\.|\[|\]/) : paths;

//     if (!paths.length) {
//         return data;
//     } else if (typeof data !== 'object') {
//         return undefined;
//     } else {
//         return traverse(data[ paths[ 0 ] ], paths.slice(1));
//     }
// };

const finish = function (node, tree, depth, data) {
    node.depth = depth;

    if (node.value === 'NaN') {
        node.type = 'nan';
    } else if (node.value === 'null') {
        node.type = 'null';
    } else if (node.value === 'true') {
        node.type = 'boolean';
    } else if (node.value === 'false') {
        node.type = 'boolean';
    } else if (node.value === 'undefined') {
        node.type = 'undefined';
    } else if (node.type === $number) {
    } else if (node.type === $string) {
    } else if (node.type === $function) {
    } else if (node.type === $binder) {
    } else {
        node.type = $variable;
    }

    tree.push(node);
};
const Node = function (value, type, depth) {
    return { value, type, depth };
};

export default function expression (expression, data) {
    const tree = [];

    let node, depth = 0;
    // let node = { value: '', type: 'binder' };

    for (let i = 0; i < expression.length; i++) {
        const c = expression[ i ];
        const next = expression[ i + 1 ];
        const previous = expression[ i - 1 ];

        if (depth === 0 && c === ' ') {
            continue;
        } else if (node?.type === $binder && c === ',') {
            // } else if (node?.type === $binder && depth === 1 && c === ',') {
            finish(node, tree, depth);
            depth--;
        } else if (depth === 0 && c === ':') {
            finish(node, tree, depth);
            depth++;
        } else if (!node && depth === 0) {
            node = Node(c, $binder, depth);
        } else if (!node && /'|`|"/.test(c)) {
            node = Node(c, $string, depth);
        } else if (/'|`|"/.test(c) && node?.type === $string) {

            node.value += c;

            if (node.value.length > 1 && node.value[ 0 ] === c && previous !== '\\') {
                finish(node, tree, depth, data);
            }

        } else if (!node && /[0-9.]/.test(c)) {
            node = Node(c, $number, depth);
        } else if (/[0-9.]/.test(c) && node?.type === $number) {
            node.type = $number;
            node.value += c;

            if (!/[0-9.]/.test(next)) {
                finish(node, tree, depth, data);
                node = { value: '' };
            }

        } else if (',' === c) {
            if (node.value) {
                finish(node, tree, depth, data);
                node = { value: '' };
            }
        } else if ('(' === c) {
            node.type = $function;
            finish(node, tree, depth, data);
            node = { value: '' };
        } else if (')' === c) {
            if (node.value) {
                finish(node, tree, depth, data);
            }
            node = { value: '' };
        } else if (/\s/.test(c)) {
            continue;
        } else if (/[a-zA-Z$_]/.test(c) && !node.type || node.type === $variable) {
            // node.depth = depth;
            node.type = $variable;
            node.value += c;
        } else {
            // node.depth = depth;
            node.value += c;
        }

    }

    return tree;
};

// start: test
const m = {
    n1: 1,
    n: { n2: 2 },

    w: 'world',

    foo: 'sFoo',
    bar: 'sBar',
    one: (two, oneDotTwo, blue) => `sOne ${two} ${oneDotTwo + 2} ${blue}`,
    two: (foo, three) => `sTwo ${foo} ${three}`,
    three: (bar, helloWorld) => `sThree ${bar} ${helloWorld + 's'}`,
};

// console.log(expression(`hello {{w}}.`, m)());
// console.log(expression(`{{n1}}`, m)());
// console.log(expression(`{{n.n2}}`, m)());

console.log(
    expression(`{{one(two(foo, three(bar, 'hello world')), 1.2)}}`, m),
    JSON.stringify(
        expression(`value:checked, checked:checked=$checked??[1,'two']??{test:'test',foo:bar}, onchange:checkInput()`, m),
        null,
        '   '
    )
);