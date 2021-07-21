import traverse from './traverse';

const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)|\/|\?|:/g;
// const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)|\/|\?|:|==|===/g;
// const replaceOutsideAndSyntax = /([^{}]*{{)|(}}[^{}]*)/g;

const seperatorReference = '\\s*\\??\\s*\\.?\\s*\\[\\s*|\\s*\\]\\s*\\??\\s*\\.?\\s*|\\s*\\??\\s*\\.\\s*';
const startReference = '[a-zA-Z_$]+';
const endReference = `((${seperatorReference})[a-zA-Z_$0-9]+)*`;

const replaceSeperator = new RegExp(`${seperatorReference}`, 'g');
const references = new RegExp(`${startReference}${endReference}`, 'g');
const matchAssignment = new RegExp(`(${startReference}${endReference})\\s*=`);

const strips = new RegExp([
    '".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`', // strings
    `(window|document|this|Math|Date|Number|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f)${endReference}`, // globals and specials
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
    const $render = {};
    const context = new Proxy({}, {
        has: () => true,
        set: (target, key, value) => {
            if (key === '$render') {
                for (const k in value) {
                    const v = value[ k ];
                    $render[ `$${k}` ] = v;
                    $render[ `$${k[ 0 ]}` ] = v;
                }
            }
            else if (key in dynamics) dynamics[ key ] = value;
            else data[ key ] = value;
            return true;
        },
        get: (target, key) => {
            if (key in $render) return $render[ key ];
            if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
            return window[ key ];
        }
    });

    const convert = !shouldNotConvert.test(statement);
    let striped = statement.replace(replaceSeperator, '.').replace(replaceOutsideAndSyntax, ';').replace(strips, '');

    if (rewrites) {
        for (const [ pattern, value ] of rewrites) {
            striped = striped.replace(new RegExp(`\\b(${pattern})\\b`, 'g'), value);
        }
        // console.log(statement, striped, rewrites, striped.match(references), striped.match(matchAssignment));
    }

    const paths = striped.match(references) || [];
    const [ , assignment ] = striped.match(matchAssignment) || [];
    const assignee = assignment ? traverse.bind(null, context, assignment) : () => undefined;

    let compute = cache.get(statement);

    if (!compute) {
        let code = statement;
        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;
        code = `if ($render) $context.$render = $render;\nwith ($context) { return ${code}; }`;
        compute = new Function('$context', '$render', code);
        cache.set(statement, compute);
    }

    compute = compute.bind(null, context);

    return { compute, assignee, paths };
};

