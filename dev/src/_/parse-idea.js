const $string = 'string';
const $number = 'number';
const $binder = 'binder';
const $unknown = 'unknown';
const $variable = 'variable';
const $function = 'function';

const finish = function (node, tree) {

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
    } else if (node.type === $variable) {
    } else {
        node.type = 'unknown';
    }

    tree.push(node);

    return null;
};

const unknown = (value, depth) => ({ value, type: '', depth });
const binder = (value, depth) => ({ value, type: $binder, depth });
const string = (value, depth) => ({ value, type: $string, depth });
const number = (value, depth) => ({ value, type: $number, depth });
const variable = (value, depth) => ({ value, type: $variable, depth });

export default function expression (expression, data) {
    const tree = [];

    let node, depth = 0;
    // let node = { value: '', type: 'binder' };

    let level = '';

    for (let i = 0; i < expression.length; i++) {
        const c = expression[ i ];
        const next = expression[ i + 1 ];
        const previous = expression[ i - 1 ];

        if (
            '=>{' === `${node?.value}${c}` ||
            '=>' === `${node?.value}${c}` ||
            '){' === `${node?.value}${c}`
        ) {
            level = 'function';
            console.log(level, `${node?.value}${c}`);
        }
        console.log(level, `${node?.value}${c}`);

        if (depth === 0) {
            if (' ' === c) {
                continue;
            } else if (',' === c) {
                finish(node, tree);
                node = unknown(c, depth);
                depth--;
            } else if (':' === c) {
                finish(node, tree);
                depth++;
                node = unknown(c, depth);
            } else if (node?.type === $binder) {
                node.value += c;
            } else {
                node = binder(c, depth);
            }
        } else if (node?.type === $string) {
            node.value += c;
            if (node.value[ 0 ] === c && previous !== '\\') {
                finish(node, tree);
                node = unknown(c, depth);
                depth--;
            }
        } else if (' ' === c) {
            continue;
        } else if (
            ';' === c ||
            '=' === c ||
            '<' === c ||
            '>' === c
        ) {
            finish(node, tree);
            node = unknown(c, depth);
        } else if (',' === c) {
            finish(node, tree);
            depth--;
            node = unknown(c, depth);
        } else if (':' === c) {
            if (depth > 0) {
                node.type = '';
                finish(node, tree);
            }
            node = unknown(c, depth);
        } else if ('[' === c || '{' === c) {
            finish(node, tree);
            node = unknown(c, depth);
            depth++;
        } else if (']' === c || '}' === c) {
            finish(node, tree);
            depth--;
            node = unknown(c, depth);
        } else if ('(' === c) {
            node.type = $variable;
            finish(node, tree);
            node = unknown(c, depth);
            depth++;
        } else if (')' === c) {
            finish(node, tree);
            depth--;
            node = unknown(c, depth);
        } else if (node?.type === $variable) {
            if (c === '?' && node?.value?.slice(-1) !== '.') {
                finish(node, tree);
                node = unknown(c, depth);
            } else {
                node.value += c;
            }
        } else if (c === '?') {
            finish(node, tree);
            node = unknown(c, depth);
        } else if (/'|`|"/.test(c) && !node?.type) {
            node = string(c, depth);
            depth++;
        } else if (/[0-9.]/.test(c) && !node?.type) {
            node = number(c, depth);
        } else if (/[a-zA-Z$_.?]/.test(c) && !node?.type) {
            node = variable(c, depth);
        } else {
            node.value += c;
        }
        console.log(node, c);
    }

    return tree;
};

// expression(`bin1:()=>test`);
// expression(`bin1:()=>{test}`);
// expression(`bin1:()=>({test})`);
// expression(`bin1:var1, bin2:var2=var3, bin3:'string'`);
expression(`bin1:{key1:var1,key2:var2,key3:{key4:var34}}`);
// expression(`bin1:var1, bin2:var2=var3, bin3:'string', bin4:123, bin5:{foo:bar,deep:{test}}`);

// const object = /([a-zA-Z$_][a-z0-9A-Z$_]+):({.*?})(?:,|$)/;
// const array = /([a-zA-Z$_][a-z0-9A-Z$_]+):(\[.*?\])(?:,|$)/;
// const single = /([a-zA-Z$_][a-z0-9A-Z$_]+):('.*')(?:,|$)/;
// const double = /([a-zA-Z$_][a-z0-9A-Z$_]+):(".*")(?:,|$)/;
// const tick = /([a-zA-Z$_][a-z0-9A-Z$_]+):(`.*`)(?:,|$)/;
// const fun = /([a-zA-Z$_][a-z0-9A-Z$_]+):(.*?=>.*?)(?:,|$)/;
