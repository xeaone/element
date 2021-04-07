
const $string = 'string';
const $number = 'number';
const $variable = 'variable';
const $function = 'function';

type Node = {
    type?: string,
    parent?: Node,
    dots?: number,
    value?: string,
    start?: string,
    children?: any[],
    execute?: () => any,
};

const traverse = function (data: any, paths: string[] | string) {
    paths = typeof paths === 'string' ? paths.split(/\.|\[|(\]\.?)/) : paths;

    if (!paths.length) {
        return data;
    } else if (typeof data !== 'object') {
        return undefined;
    } else {
        return traverse(data[paths[0]], paths.slice(1));
    }
};

const finish = function (node: any, data: any) {
    if (node.type === $string) {
        node.execute = () => node.value.slice(1, -1);
    } else if (node.type === $number) {
        node.execute = () => Number(node.value);
    } else if (node.type === $function) {
        node.execute = () => traverse(data, node.value)(...node.children.map(child => child.execute()));
    } else if (node.value === 'NaN') {
        node.type = 'nan';
        node.execute = () => NaN;
    } else if (node.value === 'null') {
        node.type = 'null';
        node.execute = () => null;
    } else if (node.value === 'undefined') {
        node.type = 'undefined';
        node.execute = () => undefined;
    } else if (node.value === 'true') {
        node.execute = () => true;
        node.type = 'boolean';
    } else if (node.value === 'false') {
        node.type = 'boolean';
        node.execute = () => false;
    } else {
        node.type = $variable;
        node.execute = () => traverse(data, node.value);
    }
};

export default function (expression: string, data: any) {

    const tree: Node = { type: 'tree', children: [], value: null, parent: null };
    let parent = tree;
    let node: Node;

    for (let i = 0; i < expression.length; i++) {
        const c = s[i];

        if (
            (/['`"]/.test(c) && !node) ||
            node?.type === $string
        ) {
            if (node?.start === c && s[i - 1] !== '\\') {
                node.value += c;
                finish(node, data);
                node.parent.children.push(node);
                node = null;
            } else if (!node) {
                node = { value: c, type: $string, start: c, parent };
            } else {
                node.value += c;
            }
        } else if (
            (/[0-9.]/.test(c) && !node) ||
            node?.type === $number && /[0-9.]/.test(c)
        ) {
            if (!node) {
                node = { value: c, type: $number, dots: 0, parent };
            } else {
                node.value += c;
            }
            if (c === '.') node.dots++;
            if (node.dots > 1) throw new SyntaxError(node.value);
        } else if (',' === c) {
            if (node) {
                finish(node, data);
                node.parent.children.push(node);
            }
            node = null;
        } else if (')' === c) {
            if (node) {
                finish(node, data);
                node.parent.children.push(node);
                parent = node.parent;
            } else {
                parent = parent.parent;
            }
            node = null;
        } else if ('(' === c) {
            node.type = $function;
            finish(node, data);
            node.parent.children.push(node);
            parent = node;
            node = null;
        } else if (/\s/.test(c)) {
            continue;
        } else {
            if (!node) {
                node = { value: c, parent, children: [] };
            } else {
                node.value += c;
            }
        }

    }

    return tree[0].execute;
};

// start: test
// const m = {
//     foo: 'sFoo',
//     bar: 'sBar',
//     one: function (two, oneDotTwo) {
//         return `sOne ${two} ${oneDotTwo + 2}`;
//     },
//     two: function (foo, three) {
//         return `sTwo ${foo} ${three}`;
//     },
//     three: function (bar, helloWorld) {
//         return `sThree ${bar} ${helloWorld + 's'}`;
//     },
// };
// const s = `one(two(foo, three(bar, 'hello world')), 1.2)`;
// window.t = parse(s, m);
// console.log(t);
//end: test

