// import parser from "./parser";

const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;
const shouldNotConvert = /^\s*{{[^{}]*}}\s*$/;
const replaceOfIn = /{{.*?\s+(of|in)\s+(.*?)}}/;
const assigneePattern = /({{)|(}})|([_$a-zA-Z0-9.?\[\]]+)[-+?^*%|\\ ]*=[-+?^*%|\\ ]*/g;

// infinite loop if assignee has assignment
// const assigneePattern = /({{.*?)([_$a-zA-Z0-9.?\[\]]+)(\s*[-+?^*%$|\\]?=[-+?^*%$|\\]?\s*[_$a-zA-Z0-9.?\[\]]+.*?}})/;

const ignores = [
    'window', 'document', 'console', 'location',
    '$assignee',
    '$instance', '$binder', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    'globalThis', 'Infinity', 'NaN', 'undefined',
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
    const binders = binder.binders.get(path);
    if (binders) {
        binders.add(binder);
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

    if (!path && binder.rewrites?.length) {

        let rewrite = key;
        for (const [ name, value ] of binder.rewrites) {
            rewrite = rewrite.replace(new RegExp(`^(${name})\\b`), value);
        }

        for (const part of rewrite.split('.')) {
            path = path ? `${path}.${part}` : part;
            bind(binder, path);
        }
    } else {
        path = path ? `${path}.${key}` : `${key}`;
        bind(binder, path);
    }

    if (target[ key ] !== value) {
        target[ key ] = value;
    }

    return true;
};

const get = function (path, binder, target, key) {
    if (typeof key !== 'string') return target[ key ];
    // if (typeof key !== 'string') return;

    if (!path && binder.rewrites?.length) {

        let rewrite = key;
        for (const [ name, value ] of binder.rewrites) {
            rewrite = rewrite.replace(new RegExp(`^(${name})\\b`), value);
        }

        for (const part of rewrite.split('.')) {
            path = path ? `${path}.${part}` : part;
            bind(binder, path);
        }
    } else {
        path = path ? `${path}.${key}` : `${key}`;
        bind(binder, path);
    }

    const value = target[ key ];

    if (value && typeof value === 'object') {
        return new Proxy(value, {
            set: set.bind(null, path, binder),
            get: get.bind(null, path, binder),
        });
    } else if (typeof value === 'function') {
        return value.bind(target);
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

        const convert = code.split(splitPattern).filter(part => part).length > 1;
        // const convert = !shouldNotConvert.test(code);
        const isValue = binder.node.name === 'value';
        const isChecked = binder.node.name === 'checked';

        // const assignee = isValue || isChecked ? code.match(assigneePattern)?.[ 2 ] || '' : '';

        let reference = '';
        let assignment = '';
        if (isValue || isChecked) {
            assignment = code.replace(assigneePattern, function (match, bracketLeft, bracketRight, assignee) {
                if (bracketLeft) {
                    return '(';
                } else if (bracketRight) {
                    return ')';
                } else {
                    reference = reference || assignee;
                    return '';
                }
            });
        }

        code = code.replace(/{{/g, convert ? `' + (` : '(');
        code = code.replace(/}}/g, convert ? `) + '` : ')');
        code = convert ? `'${code}'` : code;

        code = `
        $instance = $instance || {};
        var $f = $form = $instance.form;
        var $e = $event = $instance.event;
        with ($context) {
            try {
                ${isValue || isChecked ? `
                ${isValue ? `var $v = $value = $instance && 'value' in $instance ? $instance.value : ${reference || 'undefined'};` : ''}
                ${isChecked ? `var $c = $checked = $instance && 'checked' in $instance ? $instance.checked : ${reference || 'undefined'};` : ''}
                if ('value' in $instance || 'checked' in $instance) {
                    return ${code};
                } else {
                    return ${assignment ? assignment : code};
                }
            ` : `return ${code};`}
           } catch (error) {
                if (error.message.indexOf('Cannot set property') === 0) return;
                else if (error.message.indexOf('Cannot read property') === 0) return;
                else if (error.message.indexOf('Cannot set properties') === 0) return;
                else if (error.message.indexOf('Cannot read properties') === 0) return;
                else console.error(error);
            }
        }
        `;

        cache = new Function('$context', '$binder', '$instance', code);
        caches.set(binder.value, cache);
    }

    const context = new Proxy(binder.context, {
        has: has,
        set: set.bind(null, '', binder),
        get: get.bind(null, '', binder)
    });

    return cache.bind(null, context, binder);
};

export default computer;