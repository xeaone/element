import parser from "./parser";

const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;

const caches = new Map();

const ignores = [
    'window', 'document', 'console', 'location',
    'Object', 'Array', 'Math', 'Date', 'Number', 'String', 'Boolean', 'Promise',
    '$render', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f'
];

const bind = async function (binder, path) {

    if (binder.rewrites?.length) {
        for (const [ name, value ] of binder.rewrites) {
            path = path.replace(new RegExp(`^(${name})\\b`), value);
        }
    }

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

const set = function (path, binder, target, key, value) {
    if (typeof key !== 'string') return true;

    path = path ? `${path}.${key}` : `${key}`;

    // if (!option.paths.has(path)) {
    // option.binds += `$bind($binder,'${path}'),`;
    // option.assignments.add(path);
    // option.paths.add(path);
    bind(binder, path);
    // }

    return true;
};

const get = function (path, binder, target, key) {
    if (typeof key !== 'string') return;

    path = path ? `${path}.${key}` : `${key}`;

    // if (!option.paths.has(path)) {
    // option.binds += `$bind($binder,'${path}'),`;
    // option.paths.add(path);
    bind(binder, path);
    // }

    return new Proxy(target, {
        has: () => true,
        set: set.bind(null, path, binder),
        get: get.bind(null, path, binder),
    });
};

const computer = function (binder: any) {
    let cache = caches.get(binder.value);

    if (!cache) {

        let code = binder.value;

        // const parsed = parser(code);
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

        const cache = {
            // bind: undefined,
            // paths: new Set(),
            // assignments: new Set(),
            // binds: '',
            // paths: parsed.references,
            compute: undefined
        };

        code = `
            if ($render) {
                var $form = $f = $render.form;
                var $event = $e = $render.event;
                var $value = $v = $render.value;
                var $checked = $c = $render.checked;
            }
             if (!$binder.setup) {
                $binder.setup = true;
                with(new Proxy(function () { }, {
                    has: $has,
                    set: $set.bind(null, '', $binder),
                    get: $get.bind(null, '', $binder)
                })) { ${code}; }
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

        // cache.compute = new Function('$context', '$binder', '$render', code);
        cache.compute = new Function('$context', '$binder', '$has', '$set', '$get', '$render', code);

        // cache.compute(new Proxy(function () { }, {
        //     has,
        //     set: set.bind(null, '', cache, binder),
        //     get: get.bind(null, '', cache, binder)
        // }), binder);

        caches.set(binder.value, cache);

        // for (let path of cache.paths) {
        //     bind(binder, path);
        // }
        // return cache.compute.bind(null, binder.context, binder);

        return cache.compute.bind(null, binder.context, binder, has, set, get);
    } else {

        // for (const path of cache.paths) {
        //     bind(binder, path);
        // }
        // return cache.compute.bind(null, binder.context, binder);

        return cache.compute.bind(null, binder.context, binder, has, set, get);
    }

};

export default computer;