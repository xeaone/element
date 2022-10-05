// import Parse from './_parse';
import Standard from './standard.ts';
import Checked from './checked.ts';
import Inherit from './inherit.ts';
import Value from './value.ts';
import Html from './html.ts';
import Each from './each.ts';
import On from './on.ts';

import { BinderType, ElementType, HandlerType } from './types.ts';

const ignoreString = `
(\\b
(\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
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
true|false|null|of|in|do|if|for|new|try|case|else|with|async|await|break|catch|class|super|throw|while|
yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
([.][a-zA-Z0-9$_.? ]*)?
\\b)
`.replace(/\t|\n/g, '');

const ignorePattern = new RegExp(ignoreString, 'g');
const referencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const stringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const regularFunctionPattern = /function\s*\([a-zA-Z0-9$_,]*\)/g;
const arrowFunctionPattern = /(\([a-zA-Z0-9$_,]*\)|[a-zA-Z0-9$_]+)\s*=>/g;
const referenceNormalize = /\s*(\s*\??\.?\s*\[\s*([0-9]+)\s*\]\s*\??(\.?)\s*|\?\.)\s*/g;
const assignmentPattern = /\(.*?([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)\)/;

const Cache: Map<string, any> = new Map();

export default function Binder(node: Node, container: ElementType, context: Record<string, any>, rewrites?: Array<Array<string>>) {
    let name, value, owner;

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        value = text.textContent ?? '';
        name = 'text';
        owner = text;
        text.textContent = '';
    } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        const attr = node as Attr;
        owner = attr.ownerElement;
        value = attr.value ?? '';
        name = attr.name ?? '';
        attr.value = '';
    } else {
        throw new Error('XElement - Node not valid');
    }

    let handler: HandlerType;
    if (name === 'html') handler = Html;
    else if (name === 'each') handler = Each;
    else if (name === 'value') handler = Value;
    else if (name === 'checked') handler = Checked;
    else if (name === 'inherit') handler = Inherit;
    else if (name.startsWith('on')) handler = On;
    else handler = Standard;

    let cache = Cache.get(value);

    if (!cache) {
        const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
        const clean = code.replace(stringPattern, '').replace(arrowFunctionPattern, '').replace(regularFunctionPattern, '');
        const assignment = clean.match(assignmentPattern);
        const references = clean.replace(ignorePattern, '').replace(referenceNormalize, '.$2$3').match(referencePattern) ?? [];
        // console.log(code, clean, references, assignment);

        // const { code, references, assignmentLeft, assignmentMid, assignmentRight } = Parse(value);
        // const assignment = assignmentLeft && assignmentMid && assignmentRight ? [ undefined, assignmentLeft, assignmentMid, assignmentRight ] : null;
        // console.log(code, references, assignmentLeft, assignmentMid, assignmentRight);

        const isValue = name === 'value';
        const isChecked = name === 'checked';

        let wrapped: string;
        if (assignment && (isValue || isChecked)) {
            wrapped = `
            with ($context) {
                with ($instance) {
                    // $value = $assign ? $value : ${assignment?.[1]};
                    // $checked = $assign ? $checked : ${assignment?.[1]};
                    // return $assign ? ${assignment?.[1]} ${assignment?.[2]} $result : $result;
                    // return $assign ? ${code} : ${assignment?.[1]};
                    // return $assign ? ${code} : $value;
                    return ${code};
                }
            }
            `;
            console.log(wrapped);
            // wrapped = `
            // with ($context) {
            //     with ($instance) {
            //         $value = $assign ? $value : ${assignment?.[1]};
            //         return $assign ? ${code} : ${assignment?.[3]};
            //     }
            // }
            // `;
            // } else if (assignment && isChecked) {
            //     wrapped = `
            //     with ($context) {
            //         with ($instance) {
            //             $checked = $assign ? $checked : ${assignment?.[1]};
            //             return $assign ? ${code} : ${assignment?.[3]};
            //         }
            //     }
            //     `;
        } else {
            wrapped = `
            with ($context) {
                with ($instance) {
                   return ${code};
                }
            }
            `;
        }

        // const wrapped = `
        // with ($context) {
        //     with ($instance) {
        // ${assignment && isValue ? `$value = $assign ? $value : ${assignment?.[1]};` : ''}
        // ${assignment && isChecked ? `$checked = $assign ? $checked : ${assignment?.[1]};` : ''}
        // return ${assignment ? `$assign ? ${code} : ${assignment?.[3]}` : code};
        //     }
        // }
        // `;

        // console.log(wrapped);

        // const compute = await run(`
        const compute = new Function('$context', '$instance', wrapped);

        cache = { compute, references };
        Cache.set(value, cache);
    }

    const instance = {};
    const references: Set<string> = new Set();

    let reference, nameRewrite, valueRewrite;
    for (reference of cache.references) {
        if (rewrites) {
            for ([nameRewrite, valueRewrite] of rewrites) {
                if (reference === nameRewrite) {
                    reference = valueRewrite;
                } else if (reference.startsWith(nameRewrite + '.')) {
                    reference = valueRewrite + reference.slice(nameRewrite.length);
                }
            }
        }

        references.add(reference);
    }

    console.log(references);

    const binder: BinderType = {
        name,
        node,
        value,
        owner,
        handler,
        context,
        instance,
        container,
        references,
        meta: {},
        setup: handler.setup,
        reset: handler.reset,
        render: handler.render,
        rewrites: rewrites ? [...rewrites] : [],
        compute: cache.compute.bind(owner, context, instance),
    };

    binder.setup?.(binder);

    return binder;
}

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

// Reference Test
// const values = [
//     `{{foo?.bar}}`,
//     `{{foo?.[1]?.bar}}`,
//     `{{foo?.[1][2]}}`,
// ];

// for (const value of values) {
//     const code = ('\'' + value.replace(/\s*{{/g, '\'+(').replace(/}}\s*/g, ')+\'') + '\'').replace(/^''\+|\+''$/g, '');
//     const clean = code.replace(stringPattern, '').replace(arrowFunctionPattern, '').replace(regularFunctionPattern, '');
//     const assignment = clean.match(assignmentPattern);
//     const references = clean.replace(ignorePattern, '').replace(referenceNormalize, '.$2$3').match(referencePattern) ?? [];
//     console.log(value, assignment, references);
// }
