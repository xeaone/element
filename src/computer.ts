
const caches = new Map();
const splitPattern = /\s*{{\s*|\s*}}\s*/;

const instancePattern = /(\$\w+)/;
const bracketPattern = /({{)|(}})/;
const eachPattern = /({{.*?\s+(of|in)\s+(.*?)}})/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${eachPattern.source}|${assignmentPattern.source}|${instancePattern.source}|${bracketPattern.source}`, 'g');

const ignores = [
    // '$assignee', '$instance', '$binder', '$event', '$value', '$checked', '$form', '$e', '$v', '$c', '$f',
    // '$e', '$v', '$c', '$f',
    '$instance', '$event', '$value', '$checked', '$form',
    'this', 'window', 'document', 'console', 'location',
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

const has = function (target, key) {
    if (typeof key !== 'string') return true;
    return !ignores.includes(key);
};

const computer = function (binder) {
    let cache = caches.get(binder.value);

    if (!cache) {
        let code = binder.value;

        const convert = code.split(splitPattern).filter(part => part).length > 1;
        const isChecked = binder.node.name === 'checked';
        const isValue = binder.node.name === 'value';

        let reference = '';
        let assignment = '';
        let usesInstance = false;
        // let hasEvent, hasForm, hasValue, hasChecked;

        code = code.replace(codePattern, function (match, g1, g2, ofInRight, assignee, assigneeLeft, ref, assigneeMiddle, assigneeRight, instance, bracketLeft, bracketRight) {
            if (bracketLeft) return convert ? `' + (` : '(';
            if (bracketRight) return convert ? `) + '` : ')';
            if (ofInRight) return `(${ofInRight})`;
            if (instance) {
                usesInstance = true;
                return match;
            }
            if (assignee) {
                if (isValue || isChecked) {
                    reference = ref;
                    usesInstance = true;
                    assignment = assigneeLeft + assigneeRight;
                    return (convert ? `' + (` : '(') + assigneeLeft + ref + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                } else {
                    return (convert ? `' + (` : '(') + assigneeLeft + ref + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                }
            }
        });

        code = convert ? `'${code}'` : code;

        if (usesInstance) {
            code = `
            $instance = $instance || {};
            with ($instance) {
                with ($context) {
                    if ($instance.$assignment) {
                        return ${code};
                    } else {
                        ${isValue ? `$instance.$value = ${reference || `undefined`};` : ''}
                        ${isChecked ? `$instance.$checked = ${reference || `undefined`};` : ''}
                        return ${assignment || code};
                    }
                }
            }
            `;
        } else {
            code = `with ($context) { return ${code}; }`;
        }

        code = `
            try {
                ${code}
            } catch (error){
                console.error(error);
            }
        `;

        cache = new Function('$context', '$binder', '$instance', code);
        caches.set(binder.value, cache);
    }

    return cache.bind(null, new Proxy(binder.context, { has }), binder);
    // return cache.bind(null, binder.context, binder);
};

export default computer;