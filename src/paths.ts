import { PathsType } from './types.ts';

const IgnoreString = `
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
((\\??\\.)[a-zA-Z0-9$_.? ]*)?
\\b)
`.replace(/\t|\n/g, '');

const IgnorePattern = new RegExp(IgnoreString, 'g');
const ReferencePattern = /(\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\b)/g;
const StringPattern = /".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`/;
const RegularFunctionPattern = /function\s*\([a-zA-Z0-9$_,]*\)/g;
const ArrowFunctionPattern = /(\([a-zA-Z0-9$_,]*\)|[a-zA-Z0-9$_]+)\s*=>/g;
const ReferenceNormalize = /\s*(\s*\??\.?\s*\[\s*([0-9]+)\s*\]\s*\??(\.?)\s*|\?\.)\s*/g;
// const AssignmentPattern = /(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*)/;

const Cache: Map<string, PathsType> = new Map();

const Paths = function (value: string) {
    const cache = Cache.get(value);
    if (cache) return [...cache];

    const clean = value.replace(StringPattern, '').replace(ArrowFunctionPattern, '').replace(RegularFunctionPattern, '');
    // const assignment = clean.match(AssignmentPattern);
    const paths = clean.replace(IgnorePattern, '').replace(ReferenceNormalize, '.$2$3').match(ReferencePattern) ?? [];

    Cache.set(value, paths);

    return [...paths];
};

export default Paths;
