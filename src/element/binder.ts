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

    let handler;
    if (name === 'text') handler = Text;
    else if (name === 'html') handler = Html;
    else if (name === 'each') handler = Each;
    else if (name === 'value') handler = Value;
    else if (name === 'inherit') handler = Inherit;
    else if (name === 'checked') handler = Checked;
    else if (name.startsWith('on')) handler = On;
    else handler = Standard;

    const binder: any = {
        node,
        name,
        value,
        context,
        container,
        meta: {},
        instance: {},
        references: new Set(),
        reset: handler.reset,
        render: handler.render,
        rewrites: rewrites ? [ ...rewrites ] : [],
        owner: (node as Attr).ownerElement ?? undefined,
    };

    // binder.reset = handler.reset.bind(binder, binder);
    // binder.render = handler.render.bind(binder, binder);
    binder.cache = Cache.get(binder.value);

    if (!binder.cache) {

        const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
        const clean = code.replace(stringPattern, '');
        const assignment = clean.match(assignmentPattern);
        const references = clean.replace(ignorePattern, '').match(referencePattern) ?? [];
        // const references = clean.match(referencesPattern) ?? [];

        // console.log(
        //     code,
        //     clean,
        //     assignment,
        //     references
        // );

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

        binder.cache = { compute, references };
        Cache.set(value, binder.cache);
    }

    // if (rewrites) {
    //     binder.references = new Set();
    //     for (const reference of references) {
    //         for (const [ name, value ] of rewrites) {
    //             if (reference === name) {
    //                 binder.references.add(value);
    //             } else if (reference.startsWith(name + '.')) {
    //                 binder.references.add(value + reference.slice(name.length));
    //             } else {
    //                 binder.references.add(reference);
    //             }
    //         }
    //     }
    // } else {
    //     binder.references = new Set(references);
    // }

    binder.compute = binder.cache.compute.bind(binder.owner ?? binder.node, binder.context, binder.instance);

    return binder;
}