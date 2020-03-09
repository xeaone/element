
const space = ' ';
const number = '0123456789';
const symbol = '|&^=<>+-/*%!~()[]:?;,\'\"\`';
const lower = 'abcdefghijklmnopqrstuvwxyz';
const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const PS = '(';
const PE = ')';

const SA = '\'\"\`';

const BA = space + symbol;

const VS = '$_'  + lower + upper;
const VA = '$._'  + number + lower + upper;
const VE = space + symbol;

// const unary_ops = [ '-', '!', '~', '+' ];
//
// const binary_ops = {
//     '||':1,
//     '&&':2,
//     '|':3,
//     '^':4,
//     '&':5,
//     '==':6,
//     '!=':6,
//     '===':6,
//     '!==':6,
//     '<':7,
//     '>':7,
//     '<=':7,
//     '>=':7,
//     '<<':8,
//     '>>':8,
//     '>>>':8,
//     '+':9,
//     '-':9,
//     '*':10,
//     '/':10,
//     '%':10
// };

const NODE = function () {
    return {
        type: '',
        content: '',
        parent: null,
        children: []
    };
};

const parse = function (s) {

    let node = NODE();
    let inside = false;
    const nodes = [];

    for (let i = 0; i < s.length; i++) {
        const c = s[i];

        if (BA.includes(c)) {
            nodes.push(node);
            node = NODE();
        } else {
            node.content += c;
        }

        if (node.type === '' && VS.includes(c)) {
            node.content = c;
            node.type = 'V';
            continue;
        }

        if (node.type === 'V' && VA.includes(c)) {
            node.content += c;
            continue;
        }

        if (node.type === 'V' && VE.includes(c)) {
            if (node.parent) node.parent.children.push(node);
            else nodes.push(node);
            node = NODE();
        }

        if (node.type === '' && PS.includes(c)) {
            node.content = c;
            node.type = 'PS';
            nodes.push(node);
            node = NODE();
            node.parent = nodes[nodes.length-1];
            continue;
        }

        if (node.type === '' && PE.includes(c)) {
            node.content = c;
            node.type = 'PE';
            nodes.push(node);
            node = NODE();
            continue;
        }

        // else if (node.type === '' && SA.includes(c)) {
        //     node.content = c;
        //     node.type = 'SS';
        //     node = NODE();
        // }
        //
        // else if (node.type === 'P' && SA.includes(c)) {
        //     node.content += c;
        // }


    }

    console.log(nodes);
};

const parser = function (text) {
    const stack = [];
    text.split(';')

};


console.log(
    parser('hello(world) ? foo : bar()')
);

// const model = {
//     a: 1,
//     b: 2,
//     c: function () { return { d: 5 } },
//     e: ['a','b','c'],
//     f: [false],
//     h: ['a b','b c'],
//     g: [{ a:1 }]
// };
//
// console.log(parse('1 in [1,2,3]', model));
// console.log(parse('(1 in [1,2,3])', model));
// console.log(parse('a>=1', model));
// console.log(parse('c().d==5', model));
// console.log(parse('!(a>=1 && c().d == 5 && b<=2)', model));
// console.log(parse('a>=1 && c().d == 5 && b>2', model));
// console.log(parse('a>=1 || c().d == 5 || b>2', model));
// console.log(parse('(a>=1 && c().d == 5) || b>2', model));
// console.log(parse('a>=1 && (c().d == 5 || b>2)', model));
// console.log(parse('"a" in e', model));
// console.log(parse('"e" in e', model));
// console.log(parse('!("e" in e)', model));
// console.log(parse('!(f[0])', model));
// console.log(parse('f[0]', model));
// console.log(parse('"a b" in h', model));
// console.log(parse('a+1', model));
// console.log(parse('g[0].a+1', model));
