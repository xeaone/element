
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
    // '$binder',
    '$render',
    '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f'
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

// const set = function (binder, path, target, key, value) {
//     if (typeof key !== 'string') return true;

//     path = path ? `${path}.${key}` : `${key}`;

//     if (binder.rewrites) {
//         for (const [ name, value ] of binder.rewrites) {
//             path = path === name ? value : path;
//         }
//     }

//     bind(binder, path);

//     target[ key ] = value;

//     // binder.assignee = () => target[ key ];
//     // if (binder.assignee) {}

//     return true;
// };

// const get = function (binder, path, target, key) {
//     if (typeof key !== 'string') return;

//     path = path ? `${path}.${key}` : `${key}`;

//     if (binder.rewrites) {
//         for (const [ name, value ] of binder.rewrites) {
//             path = path === name ? value : path;
//         }
//     }

//     bind(binder, path);

//     const value = target[ key ];

//     if (value && typeof value === 'object') {
//         return new Proxy(value,
//             {
//                 // has,
//                 set: set.bind(null, binder, path),
//                 get: get.bind(null, binder, path),
//             }
//         );
//     } else {
//         return value;
//     }
// };

const set = function (path, source, target, key, value) {

    if (key === '$binder') {
        target.$binder = value;
        return true;
    }

    if (typeof key !== 'string') return true;

    path = path ? `${path}.${key}` : `${key}`;

    // if (target.$binder.rewrites) {
    //     for (const [ name, value ] of binder.rewrites) {
    //         path = path === name ? value : path;
    //     }
    // }

    bind(target.$binder, path);

    source = source || target.$binder.context;
    source[ key ] = value;

    // binder.assignee = () => target[ key ];
    // if (binder.assignee) {}

    return true;
};

const get = function (path, source, target, key) {

    if (key === '$binder') {
        return target.$binder;
    }

    if (typeof key !== 'string') return;

    if (!path && target.$binder.rewrites?.length) {
        for (const [ name, value, type ] of target.$binder.rewrites) {
            if (key === name) {
                if (type === 'variable') {
                    let result = target.$binder.context;
                    for (const part of value.split('.')) {
                        result = result[ part ];
                        path = path ? `${path}.${part}` : `${part}`;
                        if (!result) return;
                    }
                    // console.log(name, value, type);
                    bind(target.$binder, path);
                    return result;
                } else {
                    return value;
                }
            }
        }
    }

    path = path ? `${path}.${key}` : `${key}`;

    // if (!source && target.$binder.rewrites) {
    //     for (const [ name, value ] of target.$binder.rewrites) {
    //         path = path === name ? value : path;
    //     }
    //     // console.log(path);
    // }

    bind(target.$binder, path);

    source = source || target.$binder.context;
    const value = source[ key ];

    if (value && typeof value === 'object') {
        return new Proxy({ $binder: target.$binder },
            {
                set: set.bind(null, path, value),
                get: get.bind(null, path, value),
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

        // if (binder.rewrites) {
        //     for (const [ name, value ] of binder.rewrites) {
        //         code = code.replace(new RegExp(`{{(.*?[^a-zA-Z0-9.$_])?(${name})([^a-zA-Z0-9$_].*?)?}}`, 'g'), value);
        //     }
        // }

        code = `
        if ($render) {
            var $form = $f = $render.form;
            var $event = $e = $render.event;
            var $value = $v = $render.value;
            var $checked = $c = $render.checked;
        }
        $context.$binder = $binder;
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

        compute = new Function('$context', '$binder', '$render', code);
        compute = compute.bind(null, new Proxy({}, {
            // compute = compute.bind(null, new Proxy(binder.context, {
            has,
            set: set.bind(null, '', null),
            get: get.bind(null, '', null)
            // set: set.bind(null, '', binder.container.data),
            // get: get.bind(null, '', binder.container.data)
        }));
        cache.set(binder.value, compute);
    };

    return compute.bind(null, binder);

    // return compute.bind(null, new Proxy(binder.context, {
    //     has,
    //     set: set.bind(null, binder, ''),
    //     get: get.bind(null, binder, '')
    // }));
};

export default computer;