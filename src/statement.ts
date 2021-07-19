import traverse from './traverse';

const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)/g;
// |({.*?})|(\s*\(+)+\s*)|(\s*(\=)+\s*)|(\s*(\:)+\s*)|(\s*(\?)+\s*)
const replaceSeperators = /\?\.\[|\]\?\.|\?\.|\s*\.\s*|\s*\[\s*|\s*\]\s*/g;

const reference = '([a-zA-Z_$\\[\\]][a-zA-Z_$0-9]*|\\s*("|`|\'|{|}|\\?\\s*\\.|\\.|\\[|\\])\\s*)';
const references = new RegExp(`${reference}+(?!.*\\1)`, 'g');
const matchAssignment = /([a-zA-Z0-9$_.'`"\[\]]+)\s*=([^=]+|$)/;

const strips = new RegExp([
    // ';|:',
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

    dynamics = dynamics || {};
    const context = new Proxy(data, {
        has: () => true,
        set: (_, key, value) => {
            if (key[ 0 ] === '$') dynamics[ key ] = value;
            else data[ key ] = value;
            return true;
        },
        get: (_, key) => {
            if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
            return window[ key ];
        }
    });

    const convert = !shouldNotConvert.test(statement);
    let striped = statement.replace(replaceSeperators, '.').replace(replaceOutsideAndSyntax, ';').replace(strips, '');

    if (rewrites) {
        for (const [ pattern, value ] of rewrites) {
            striped = striped.replace(pattern, (s, g1, g2, g3) => g1 + value + g3);
        }
    }

    const paths = striped.match(references) || [];
    const [ , assignment ] = striped.match(matchAssignment) || [];
    const assignee = assignment ? traverse.bind(null, context, assignment) : () => undefined;

    let compute;
    if (cache.has(statement)) {
        compute = cache.get(statement).bind(null, context);
    } else {
        let code = statement;
        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        // console.log([ statement, code, striped, paths ].join('\n'));

        code = `
            if ($render) {
                $context.$f = $render.form; $context.$form = $render.form;
                $context.$e = $render.event; $context.$event = $render.event;
                $context.$v = $render.value; $context.$value = $render.value;
                $context.$c = $render.checked; $context.$checked = $render.checked;
            }
            with ($context) {
                return ${code};
            }
        `;
        compute = new Function('$context', '$render', code);
        cache.set(statement, compute);

        // try {
        //     const handler = {
        //         has: () => true,
        //         apply: () => undefined,
        //         set: () => {

        //             return true;
        //         },
        //         get: (target, key) => {
        //             if (typeof key === 'string' && target[ key ] === undefined) {
        //                 const $path = target.$path ? `${target.$path}.${key}` : key;
        //                 console.log(key, $path);
        //                 target[ key ] = new Proxy({ $path }, handler);
        //             }
        //             return target[ key ];
        //         }
        //     };
        //     compute(new Proxy({ $path: '' }, handler));
        // } catch { }

        compute = compute.bind(null, context);


    }

    return { compute, assignee, paths };
};

