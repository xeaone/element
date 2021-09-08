
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
        // const assignee = statement.match(/{{.*?([a-zA-Z0-9.?\[\]]+)\s*=[^=]*}}/)?.[ 1 ];

        let code = statement;
        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        // $context.$render = $render;
        // ${assignee ? `if (!$render || !('value' in $render)) $v = $value = ${assignee}` : ''}
        // ${assignee ? `if (!$render || !('checked' in $render)) $c = $checked = ${assignee}` : ''}

        code = `
        if ($render) {
            for (let key in $render) {
                let value = $render[ key ];
                $context[ '$' + key ] = value;
                $context[ '$' + key[ 0 ] ] = value;
            }
        }
        with ($context) {
            try {
                return ${code};
            } catch (error) {
                // console.warn(error);
                if (error.message.indexOf('Cannot set property') === 0) return undefined;
                else if (error.message.indexOf('Cannot read property') === 0) return undefined;
                else if (error.message.indexOf('Cannot set properties') === 0) return undefined;
                else if (error.message.indexOf('Cannot read properties') === 0) return undefined;
                else console.error(error);
            }
        }
        `;

        compute = new Function('$context', '$render', code);

        cache.set(statement, compute);
    }

    return compute.bind(null, context);
};

export default computer;