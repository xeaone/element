import parse from './parse';
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
const hasAssignment = new RegExp(`(${startReference}${endReference})\\s*=`);
// const matchAssignment = new RegExp(`(${startReference}${endReference})\\s*=`);

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

// const has = () => true;
// const get = (target, key) => typeof key === 'string' ? new Proxy({}, { has, get }) : undefined;

const Statement = function (statement: string, data: any, dynamics?: any, rewrites?: any) {

    if (isOfIn.test(statement)) {
        statement = statement.replace(replaceOfIn, '{{$2}}');
    }

    dynamics = dynamics || {};
    const $render = {};
    const context = new Proxy({}, {
        has: () => true,
        set: (target, key, value) => {
            if (typeof key !== 'string') return true;
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
            if (typeof key !== 'string') return;
            if (key in $render) return $render[ key ];
            if (key in dynamics) return dynamics[ key ];
            if (key in data) return data[ key ];
            if (key in window) return window[ key ];
            return undefined;
        }
    });

    const convert = !shouldNotConvert.test(statement);

    // let striped = statement.replace(replaceSeperator, '.').replace(replaceOutsideAndSyntax, ';').replace(strips, '');

    // if (rewrites) {
    //     for (const [ pattern, value ] of rewrites) {
    //         striped = striped.replace(new RegExp(`\\b(${pattern})\\b`, 'g'), value);
    //     }
    // }

    // // console.log(statement, striped, rewrites, striped.match(references));

    // const paths = striped.match(references) || [];
    // const assignment = paths[ 0 ];
    // // const assignment = hasAssignment.test(striped) ? paths[ 0 ] : undefined;
    // // const [ , assignment ] = striped.match(matchAssignment) || [];
    // const assignee = assignment ? traverse.bind(null, context, assignment) : () => undefined;

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

    // const getPaths = [];
    // const setPaths = [];
    // const ignoresPaths = /^(window|location|console|document|this|Math|Date|Number|\$event|\$value|\$checked|\$form|\$e|\$v|\$c|\$f)\b/;

    // const proxy = function (path: string = '', ignore: boolean | undefined) {
    //     return new Proxy(() => { }, { has, set: set.bind(null, path, ignore), get: get.bind(null, path, ignore) });
    // };

    // const has = function () {
    //     return true;
    // };

    // const set = function (path, ignore, target, key) {
    //     if (typeof key !== 'string') return true;

    //     path = path ? `${path}.${key}` : key;
    //     ignore = ignore ?? ignoresPaths.test(path);
    //     if (!ignore && !setPaths.includes(path)) setPaths.push(path);

    //     target[ key ] = proxy(path, ignore);

    //     return true;
    // };

    // const get = function (path, ignore, target, key) {
    //     if (typeof key !== 'string') return;

    //     path = path ? `${path}.${key}` : key;
    //     ignore = ignore ?? ignoresPaths.test(path);
    //     if (!ignore && !getPaths.includes(path)) getPaths.push(path);

    //     return proxy(path, ignore);
    // };

    // const proxyPaths = new Proxy({}, { has, set: set.bind(null, '', null), get: get.bind(null, '', null) });
    // compute.call(null, proxyPaths);
    // const assignee = setPaths[ 0 ] ? traverse.bind(null, context, setPaths[ 0 ]) : () => undefined;
    // const paths = getPaths;

    compute = compute.bind(null, context);

    const parsed = parse(statement, rewrites);
    const paths = parsed.references;
    const assignee = parsed.assignees[ 0 ] ? traverse.bind(null, context, parsed.assignees[ 0 ]) : () => undefined;

    return { compute, assignee, paths };
};


export default Statement;