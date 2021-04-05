

const m = {
    foo: 'foo',
    bar: 'bar',
    one: function (two, oneDotTwo) {
        return `${two} ${oneDotTwo}`;
    },
    two: function (three) {
        return three;
    },
    three: function (bar, helloWorld) {
        return `${bar} ${helloWorld}`;
    },
};
const s = `one(two(foo, three(bar, 'hello world')), 1.2)`;

let $string = 'string';
let $number = 'number';
let $variable = 'variable';
let $function = 'function';

let tree = { type: 'tree', children: [] };
let parent = tree;
let node = null;

const parse = function () {
    if (node.type === $string) {
        node.value = node.value.slice(1, -1);
    } else if (node.type === $number) {
        node.value = Number(node.value);
    } else if (node.type === $function) {
        node.value = function () {
            // get
            // bind children
            return;
        };
    } else if (node.value === 'NaN') {
        node.value = NaN;
        node.type = 'nan';
    } else if (node.value === 'null') {
        node.value = null;
        node.type = 'null';
    } else if (node.value === 'undefined') {
        node.value = undefined;
        node.type = 'undefined';
    } else if (node.value === 'true') {
        node.value = true;
        node.type = 'boolean';
    } else if (node.value === 'false') {
        node.value = false;
        node.type = 'boolean';
    } else {
        Object.defineProperty('value', {
            get: function () { }
        });
        node.type = $variable;
    }
};

for (let i = 0; i < s.length; i++) {
    const c = s[ i ];

    if (
        (/['`"]/.test(c) && !node) ||
        node?.type === string
    ) {
        if (node?.start === c && s[ i - 1 ] !== '\\') {
            node.value += c;
            node.parent.children.push(node);
            node = null;
        } else if (!node) node = { value: c, type: $string, start: c, parent };
        else node.value += c;
    } else if (
        (/[0-9.]/.test(c) && !node) ||
        node?.type === number && /[0-9.]/.test(c)
    ) {
        if (!node) node = { value: c, type: $number, dots: 0, parent };
        else node.value += c;
        if (c === '.') node.dots++;
        if (node.dots > 1) throw new SyntaxError('invalid dot');
        // } else if (
        //     (/[_$a-zA-Z]/.test(c) && !node) ||
        //     node?.type === variable && /[._$a-zA-Z0-9\[\] ]/.test(c)
        // ) {
        //     if (!node) node = { value: c, type: variable, parent, children: [] };
        //     else node.value += c;
    } else if (',' === c) {
        if (node) {
            parse(node);
            node.parent.children.push(node);
        }
        node = null;
    } else if (')' === c) {
        if (node) {
            parse(node);
            node.parent.children.push(node);
            parent = node.parent;
        } else {
            parent = parent.parent;
        }
        node = null;
    } else if ('(' === c) {
        node.type = $function;
        parse(node);
        node.parent.children.push(node);
        parent = node;
        node = null;
    } else {
        if (!node) node = { value: c, parent, children: [] };
        else node.value += c;
    }

}

if (node) tree.children.push(node);

console.log(tree);
