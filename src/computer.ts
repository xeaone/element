
const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;

const cache = new Map();

const computer = function (statement: string, context: object) {

    if (isOfIn.test(statement)) {
        statement = statement.replace(replaceOfIn, '{{$2}}');
    }

    let compute = cache.get(statement);

    if (!compute) {
        const convert = !shouldNotConvert.test(statement);
        let code = statement;
        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;
        code = `if ($render) $context.$render = $render;\nwith ($context) { return ${code}; }`;
        compute = new Function('$context', '$render', code);
        cache.set(statement, compute);
    }

    return compute.bind(null, context);
};

export default computer;