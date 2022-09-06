// import Parse from './parse';
import XElement from './element';
import Standard from './standard';
import Checked from './checked';
import Inherit from './inherit';
import Value from './value';
import Text from './text';
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

export default function Binder (node: Node, container: XElement, context: Record<string, any>, rewrites?: Array<Array<string>>) {

    const value = node.nodeValue ?? '';
    const name = node.nodeType === Node.ATTRIBUTE_NODE ? (node as Attr).name :
        node.nodeType === Node.TEXT_NODE ? 'text' : node.nodeName;

    node.nodeValue = '';

    let handler: Handler;
    if (name === 'text') handler = Text as Handler;
    else if (name === 'html') handler = Html as Handler;
    else if (name === 'each') handler = Each as Handler;
    else if (name === 'value') handler = Value as Handler;
    else if (name === 'inherit') handler = Inherit as Handler;
    else if (name === 'checked') handler = Checked as Handler;
    else if (name.startsWith('on')) handler = On as Handler;
    else handler = Standard;

    const binder: any = {
        name, value,
        node, handler,
        context, container,
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render,
        references: new Set(),
        meta: {}, instance: {},
        rewrites: rewrites ? [ ...rewrites ] : [],
        owner: (node as Attr).ownerElement ?? node,
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

        const compute = new Function('$context', '$instance', `
        try {
            with ($context) {
                with ($instance) {
                    ${assignment && isValue ? `$value = $assign ? $value : ${assignment?.[ 1 ]};` : ''}
                    ${assignment && isChecked ? `$checked = $assign ? $checked : ${assignment?.[ 1 ]};` : ''}
                    return ${assignment ? `$assign ? ${code} : ${assignment?.[ 3 ]}` : code};
                }
            }
        } catch (error){
            console.error(error);
        }
        `);

        cache = { compute, references };
        Cache.set(value, cache);
    }

    for (let reference of cache.references) {

        if (rewrites) {
            for (const [ name, value ] of rewrites) {
                reference = reference === name ? value :
                    reference.startsWith(name + '.') ? value + reference.slice(name.length) :
                        reference;
            }
        }

        binder.references.add(reference);
    }

    binder.compute = cache.compute.bind(binder.owner ?? binder.node, binder.context, binder.instance);

    return binder;
}