import traverse from './traverse';

const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)/g;

const seperatorReference = '\\s*\\??\\s*\\.?\\s*\\[\\s*|\\s*\\]\\s*\\??\\s*\\.?\\s*|\\s*\\??\\s*\\.\\s*';
const startReference = '[a-zA-Z_$]+';
const endReference = `((${seperatorReference})[a-zA-Z_$0-9]+)*`;

const matchAssignment = /([a-zA-Z0-9$_.'`"\[\]]+)\s*=([^=]+|$)/;
const replaceSeperator = new RegExp(`${seperatorReference}`, 'g');
const references = new RegExp(`${startReference}${endReference}`, 'g');

const strips = new RegExp([
    '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`', // strings
    `(window|document|this|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${endReference}`, // globals and specials
    `\\btrue\\b|\\bfalse\\b|\\bnull\\b|\\bundefined\\b|\\bNaN\\b|\\bof\\b|\\bin\\b|
    \\bdo\\b|\\bif\\b|\\bfor\\b|\\blet\\b|\\bnew\\b|\\btry\\b|\\bvar\\b|\\bcase\\b|\\belse\\b|\\bwith\\b|\\bawait\\b|
    \\bbreak\\b|\\bcatch\\b|\\bclass\\b|\\bconst\\b|\\bsuper\\b|\\bthrow\\b|\\bwhile\\b|\\byield\\b|\\bdelete\\b|
    \\bexport\\b|\\bimport\\b|\\breturn\\b|\\bswitch\\b|\\bdefault\\b|\\bextends\\b|\\bfinally\\b|\\bcontinue\\b|
    \\bdebugger\\b|\\bfunction\\b|\\barguments\\b|\\btypeof\\b|\\bvoid\\b`,
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const cache = new Map();

export default function (statement: string, data: any, dynamics?: any, rewrites?: any) {

    if (isOfIn.test(statement)) {
        statement = statement.replace(replaceOfIn, '{{$2}}');
    }

    dynamics = dynamics || {};
    const context = new Proxy({}, {
        has: () => true,
        set: (target, key, value) => {
            if (key === '$render') {
                for (const name in value) {
                    target[ `$${name}` ] = value[ name ];
                }
                return true;
            }

            if (key in dynamics) return dynamics[ key ] = value;
            return data[ key ] = value;
        },
        get: (target, key) => {
            if (key in target) return target[ key ];
            if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
            return window[ key ];
        }
    });

    const convert = !shouldNotConvert.test(statement);
    let striped = statement.replace(replaceSeperator, '.').replace(replaceOutsideAndSyntax, ';').replace(strips, '');

    if (rewrites) {
        for (const [ pattern, value ] of rewrites) {
            striped = striped.replace(pattern, (s, g1, g2, g3) => g1 + value + g3);
        }
        // console.log(statement, striped, rewrites, striped.match(references) || []);
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
        code = `if ($render) $context.$render = $render;\nwith ($context) { return ${code}; }`;
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

