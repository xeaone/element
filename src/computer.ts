
const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;

const cache = new Map();

// const skips = new RegExp([
//     `^(
//         window|document|console|location|
//         Object|Array|Math|Date|Number|String|Boolean|Promise|
//         \\$render|\\$event|\\$value|\\$checked|\\$form|\\$r|\\$e|\\$v|\\$c|\\$f
//     )\\b`,
// ].join('').replace(/\s|\t|\n/g, ''));

const ignores = [
    'window', 'document', 'console', 'location',
    'Object', 'Array', 'Math', 'Date', 'Number', 'String', 'Boolean', 'Promise',
    '$render', '$event', '$value', '$checked', '$form', '$r', '$e', '$v', '$c', '$f'
];

const bind = async function (binder, path) {
    if (!binder.binders.has(path)) {
        binder.binders.set(path, new Set([ binder ]));
    } else {
        binder.binders.get(path).add(binder);
    }
};

const has = function (target, key) {
    if (typeof key !== 'string') return true;
    return ignores.includes(key) ? false : true;
};

const set = function (binder, path, target, key, value) {
    if (typeof key !== 'string') return true;

    path = path ? `${path}.${key}` : `${key}`;

    if (binder.rewrites) {
        for (const [ name, value ] of binder.rewrites) {
            path = path === name ? value : path;
        }
    }

    bind(binder, path);

    target[ key ] = value;

    // binder.assignee = () => target[ key ];
    // if (binder.assignee) {}

    return true;
};

const get = function (binder, path, target, key) {
    if (typeof key !== 'string') return;

    path = path ? `${path}.${key}` : `${key}`;

    if (binder.rewrites) {
        for (const [ name, value ] of binder.rewrites) {
            path = path === name ? value : path;
        }
    }

    bind(binder, path);

    const value = target[ key ];

    if (value && typeof value === 'object') {
        return new Proxy(value,
            {
                // has,
                set: set.bind(null, binder, path),
                get: get.bind(null, binder, path),
            }
        );
    } else {
        return value;
    }
};

const computer = function (binder: any) {
    let compute = cache.get(binder.value);

    if (!compute) {

        let code = binder.value;
        // if (isOfIn.test(code)) {
        code = code.replace(replaceOfIn, '{{$2}}');
        // }

        const convert = !shouldNotConvert.test(code);
        // const assignee = code.match(/{{.*?([a-zA-Z0-9.?\[\]]+)\s*=[^=]*}}/)?.[ 1 ];

        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        // $context.$render = $render;
        // ${assignee ? `if (!$render || !('value' in $render)) $v = $value = ${assignee}` : ''}
        // ${assignee ? `if (!$render || !('checked' in $render)) $c = $checked = ${assignee}` : ''}

        code = `
        if ($render) {
            var $form = $f = $render.form;
            var $event = $e = $render.event;
            var $value = $v = $render.value;
            var $checked = $c = $render.checked;
        }
        with ($context) {
            try {
                return ${code};
            } catch (error) {
                console.warn(error);
                if (error.message.indexOf('Cannot set property') === 0) return undefined;
                else if (error.message.indexOf('Cannot read property') === 0) return undefined;
                else if (error.message.indexOf('Cannot set properties') === 0) return undefined;
                else if (error.message.indexOf('Cannot read properties') === 0) return undefined;
                else console.error(error);
            }
        }
        `;

        compute = new Function('$context', '$render', code);
        cache.set(binder.value, compute);
    }

    return compute.bind(null, new Proxy(binder.context, {
        has,
        set: set.bind(null, binder, ''),
        get: get.bind(null, binder, '')
    }));
};

export default computer;