// import parser from "./parser";

// const isOfIn = /{{.*?\s+(of|in)\s+.*?}}/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;

const caches = new Map();

const ignores = [
    'window', 'document', 'console', 'location',
    '$assignee',
    '$instance', '$binder', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    'globalThis', 'Infintiy', 'NaN', 'undefined',
    'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent ',
    'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError', 'AggregateError',
    'Object', 'Function', 'Boolean', 'Symbole', 'Array',
    'Number', 'Math', 'Date', 'BigInt',
    'String', 'RegExp',
    'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
    'Int32Array', 'Uint32Array', 'BigInt64Array', 'BigUint64Array', 'Float32Array', 'Float64Array',
    'Map', 'Set', 'WeakMap', 'WeakSet',
    'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics', 'JSON',
    'Promise', 'GeneratorFunction', 'AsyncGeneratorFunction', 'Generator', 'AsyncGenerator', 'AsyncFunction',
    'Reflect', 'Proxy',
];



const bind = async function (binder, path) {

    if (binder.paths.has(path)) return;
    else binder.paths.add(path);

    if (binder.rewrites?.length) {
        for (const [ name, value ] of binder.rewrites) {
            path = path.replace(new RegExp(`^(${name})\\b`), value);
        }
    }

    if (binder.binders.has(path)) {
        binder.binders.get(path).add(binder);
    } else {
        binder.binders.set(path, new Set([ binder ]));
    }
};

const has = function (target, key) {
    if (typeof key !== 'string') return true;
    return ignores.includes(key) ? false : true;
};

const set = function (path, binder, target, key, value) {
    if (typeof key !== 'string') return true;

    path = path ? `${path}.${key}` : `${key}`;
    bind(binder, path);

    if (target[ key ] !== value) {
        target[ key ] = value;
    }

    return true;
};

const get = function (path, binder, target, key) {
    if (typeof key !== 'string') return;

    path = path ? `${path}.${key}` : `${key}`;
    bind(binder, path);

    const value = target[ key ];

    if (value !== null && typeof value === 'object') {
        return new Proxy(value, {
            set: set.bind(null, path, binder),
            get: get.bind(null, path, binder),
        });
    } else {
        return value;
    }

};

const computer = function (binder: any) {
    let cache = caches.get(binder.value);

    if (!cache) {
        let code = binder.value;

        // const parsed = parser(code);

        code = code.replace(replaceOfIn, '{{$2}}');

        const convert = !shouldNotConvert.test(code);
        let assignees = [];

        if (
            binder.node.name === 'value' ||
            binder.node.name === 'checked'
        ) {
            assignees = code.match(/({{)(.*?)([a-zA-Z0-9.?\[\]]+)\s*[+-]?=[+-]?\s*([^=]*)(}})/) || [];
        }

        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        // ${binder.node.name === 'value' ? `var $v = $value =  $instance.value;` : ``}
        // ${binder.node.name === 'checked' ? `var $c = $checked =  $instance.checked;` : ``}

        if (
            binder.node.name === 'value' ||
            binder.node.name === 'checked'
        ) {
            code = `
            if (!('value' in $instance)) {
                var $v = $value = ${assignees[ 3 ] || 'undefined || $binder.node.value'};
                var $c = $checked = ${assignees[ 3 ] || 'undefined || $binder.node.checked'};
                return ${assignees.length ? assignees[ 2 ] : code} ${assignees.length ? assignees[ 4 ] : ''};
            } else {
                var $v = $value = $instance.value;
                var $c = $checked = $instance.checked;
                return ${code};
            }
            `;
        } else {
            code = `return ${code};`;
        }

        code = `
        $instance = $instance || {};
        with ($context) {
            try {
                ${code}
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

        cache = new Function('$context', '$binder', '$instance', code);
        caches.set(binder.value, cache);

        // for (let path of cache.paths) {
        //     bind(binder, path);
        // }
        // return cache.compute.bind(null, binder.context, binder);
    }

    const context = new Proxy(binder.context, {
        has: has,
        set: set.bind(null, '', binder),
        get: get.bind(null, '', binder)
    });

    return cache.bind(null, context, binder);
};

export default computer;