// import Parse from './parse';
import XElement from './element';
import Standard from './standard';
import Checked from './checked';
import Inherit from './inherit';
import Value from './value';
import Html from './html';
import Each from './each';
import On from './on';

type Handler = {
    setup?: (binder?: any) => void;
    reset: (binder?: any) => void;
    render: (binder?: any) => void;
};

// type Compute = (context: Record<string, any>, instance: Record<string, any>) => any;

const referencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const stringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const assignmentPattern = /\(.*?([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)\)/;

const ignorePattern = new RegExp(`
(\\b\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
event|this|window|document|console|location|navigation|
globalThis|Infinity|NaN|undefined|
isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
Object|Function|Boolean|Symbole|Array|
Number|Math|Date|BigInt|
String|RegExp|
Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
Map|Set|WeakMap|WeakSet|
ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
Reflect|Proxy|
true|false|null|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
(([.][a-zA-Z0-9$_.? ]*)?\\b)
`.replace(/\t|\n/g, ''), 'g');

// const referenceNormalize = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;

const Cache: Map<string, any> = new Map();

// const X: Record<string, any> = {};
// (window as any).X = X;

// const run = function (code: string) {
//     return new Promise(function (resolve, reject) {

//         const id = crypto.randomUUID();

//         code = `window.X['${id}'] = function ($context, $instance) {
//         ${code}
//         };`;

//         const blob = new Blob([ code ], { type: 'text/javascript' });
//         const script = document.createElement('script');

//         // if ('noModule' in script) {
//         // }

//         // script.type = 'module';
//         script.src = URL.createObjectURL(blob);

//         script.onerror = function (error) {
//             reject(error);
//             script.remove();
//             URL.revokeObjectURL(script.src);
//         };

//         script.onload = function () {
//             resolve(X[ id ]);
//             script.remove();
//             URL.revokeObjectURL(script.src);
//         };

//         script.src = URL.createObjectURL(blob);

//         document.head.appendChild(script);
//     });
// };

export default function Binder (node: Node, container: XElement, context: Record<string, any>, rewrites?: Array<Array<string>>) {

    let name, value, owner;
    if (node.nodeType === Node.TEXT_NODE) {
        owner = node;
        name = 'text';
        value = node.textContent ?? '';
        node.textContent = '';
    } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        name = (node as Attr).name ?? '';
        value = (node as Attr).value ?? '';
        // parentNode required for linkdom bug
        owner = (node as Attr).ownerElement ?? (node as Attr).parentNode as Node;
        (node as Attr).value = '';
    } else {
        throw new Error('XElement - Node not valid');
    }

    let handler: Handler;
    if (name === 'html') handler = Html as Handler;
    else if (name === 'each') handler = Each as Handler;
    else if (name === 'value') handler = Value as Handler;
    else if (name === 'inherit') handler = Inherit as Handler;
    else if (name === 'checked') handler = Checked as Handler;
    else if (name.startsWith('on')) handler = On as Handler;
    else handler = Standard;

    const binder: any = {
        name, value, owner, node, handler, context, container,
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render,
        references: new Set(),
        meta: {}, instance: {},
        rewrites: rewrites ? [ ...rewrites ] : [],
    };

    binder.setup?.(binder);

    let cache = Cache.get(binder.value);

    if (!cache) {
        const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
        const clean = code.replace(stringPattern, '');
        const assignment = clean.match(assignmentPattern);
        const references = clean.replace(ignorePattern, '').match(referencePattern) ?? [];

        // binder.cache = Parse(value);
        const isValue = name === 'value';
        const isChecked = name === 'checked';
        // const assignment = binder.cache.assignmentLeft && binder.cache.assignmentMid && binder.cache.assignmentRight;

        // const compute = await run(`
        const compute = new Function('$context', '$instance', `
        with ($context) {
            with ($instance) {
                ${assignment && isValue ? `$value = $assign ? $value : ${assignment?.[ 1 ]};` : ''}
                ${assignment && isChecked ? `$checked = $assign ? $checked : ${assignment?.[ 1 ]};` : ''}
                return ${assignment ? `$assign ? ${code} : ${assignment?.[ 3 ]}` : code};
            }
        }
        `);

        cache = { compute, references };
        Cache.set(value, cache);
    }

    let reference, nameRewrite, valueRewrite;
    for (reference of cache.references) {
        if (rewrites) {
            for ([ nameRewrite, valueRewrite ] of rewrites) {
                reference = reference === nameRewrite ? valueRewrite :
                    reference.startsWith(nameRewrite + '.') ? valueRewrite + reference.slice(nameRewrite.length) :
                        reference;
            }
        }

        binder.references.add(reference);
    }

    binder.compute = cache.compute.bind(binder.owner ?? binder.node, binder.context, binder.instance);

    return binder;
}