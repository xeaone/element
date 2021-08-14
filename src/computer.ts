
const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;

const cache = new Map();

const computer = function (statement: string, context: object) {

    let compute = cache.get(statement);

    if (!compute) {

        if (isOfIn.test(statement)) {
            statement = statement.replace(replaceOfIn, '{{$2}}');
        }

        const convert = !shouldNotConvert.test(statement);

        let code = statement;
        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        code = `
        if ($render) $context.$render = $render;
        with ($context) {
            try {
                return ${code};
            } catch (error) {
                console.error(error);
                return undefined;
            }
        }
        `;

        compute = new Function('$context', '$render', code);

        cache.set(statement, compute);
    }

    return compute.bind(null, context);
};

export default computer;