import XElement from './element.ts';

// const referenceNormalize = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
const referenceMatch = new RegExp([
    '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
    '((?:^|}}).*?{{)',
    '(}}.*?(?:{{|$))',
    `(
        (?:\\$assignee|\\$instance|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
        this|window|document|console|location|
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
        true|false|null|undefined|NaN|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
        yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
        (?:(?:[.][a-zA-Z0-9$_.? ]*)?\\b)
    )`,
    '(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)' // reference
].join('|').replace(/\s|\t|\n/g, ''), 'g');

const splitPattern = /\s*{{\s*|\s*}}\s*/;
const bracketPattern = /({{)|(}})/;
const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');

type Compute = (context: any, instance?: any) => any;

const get = function (references: string[], reference: string, target: any, key: any): any {
    if (typeof key !== 'string') return target[ key ];

    let value;
    const rewrite = target[ `$$${key}` ];
    if (rewrite) {
        key = `${rewrite[ 0 ]}.${rewrite[ 1 ]}`;
        value = target[ rewrite[ 0 ] ][ rewrite[ 1 ] ];
        references.push(reference ? `${reference}.${rewrite[ 0 ]}` : rewrite[ 0 ]);
    } else {
        value = target[ key ];
    }

    reference = reference ? `${reference}.${key}` : key;
    references.push(reference);

    return typeof value === 'object' ?
        new Proxy(value, { get: get.bind(null, references, reference) }) :
        value;
};

export default class Binder {

    static handlers = [
        'on',
        'text',
        'html',
        'each',
        'value',
        'checked',
        'inherit',
        'standard'
    ];

    static referenceCache: Map<string, Array<string>> = new Map();
    static computeCache: Map<string, Compute> = new Map();

    context: any;
    type: string;
    name: string;
    value: string;

    node: Node;
    owner?: Element;
    container: XElement;
    references: Array<string> = [];

    compute: (instance?: any) => any;

    meta: Record<string, any> = {};

    register: XElement[ 'register' ];
    release: XElement[ 'release' ];

    constructor (node: Node, container: XElement, context: any) {

        this.node = node;
        this.context = context;
        this.container = container;

        this.value = node.nodeValue ?? '';
        this.name = node.nodeName.startsWith('#') ? node.nodeName.slice(1) : node.nodeName;

        this.owner = (node as Attr).ownerElement ?? undefined;
        this.register = this.container.register.bind(this.container);
        this.release = this.container.release.bind(this.container);
        this.type = this.name.startsWith('on') ? 'on' : (this.constructor as any).handlers.includes(this.name) ? this.name : 'standard';

        this.node.nodeValue = '';

        const referenceCache = (this.constructor as any).referenceCache.get(this.value);
        if (referenceCache) {
            referenceCache.call(this.owner ?? this.node, new Proxy(this.context, { get: get.bind(null, this.references, '') }));
        } else {
            const data = this.value;

            // const data = this.value.replace(referenceNormalize, '.$2');
            let references = '';
            let match = referenceMatch.exec(data);
            while (match) {
                // console.log(match);
                const reference = match[ 5 ];
                if (reference) references += references ? `,${reference}` : reference;
                match = referenceMatch.exec(data);
            }

            if (references.length) {
                // console.log(references, this.value);
                const referenceCache = new Function('$context', `with($context){(${references});}`);
                (this.constructor as any).referenceCache.set(data, referenceCache);
                referenceCache.call(this.owner ?? this.node, new Proxy(this.context, { get: get.bind(null, this.references, '') }));
            }

        }

        const compute = (this.constructor as any).computeCache.get(this.value);
        if (compute) {
            this.compute = compute.bind(this.owner ?? this.node, this.context);
        } else {
            let reference = '';
            let assignment = '';
            let code = this.value;

            const isValue = this.name === 'value';
            const isChecked = this.name === 'checked';
            const convert = code.split(splitPattern).filter((part: string) => part).length > 1;

            code = code.replace(codePattern, (_match, str: string, assignee: string, assigneeLeft: string, r: string, assigneeMiddle: string, assigneeRight: string, bracketLeft: string, bracketRight: string) => {
                if (str) return str;
                if (bracketLeft) return convert ? `' + (` : '(';
                if (bracketRight) return convert ? `) + '` : ')';
                if (assignee) {
                    if (isValue || isChecked) {
                        reference = r;
                        assignment = assigneeLeft + assigneeRight;
                    }
                    return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
                }
                console.warn('possible compute issue');
                return '';
            }) ?? '';

            code = convert ? `'${code}'` : code;

            code =
                (reference && isValue ? `$value = $assignment ? $value : ${reference};\n` : '') +
                (reference && isChecked ? `$checked = $assignment ? $checked : ${reference};\n` : '') +
                `return ${assignment ? `$assignment ? ${code} : ${assignment}` : `${code}`};`;

            code = `
            try {
                $instance = $instance || {};
                with ($context) {
                    with ($instance) {
                        ${code}
                    }
                }
            } catch (error){
                console.error(error);
            }
            `;

            const compute = new Function('$context', '$instance', code) as Compute;
            (this.constructor as any).computeCache.set(this.value, compute);
            this.compute = compute.bind(this.owner ?? this.node, this.context);
        }

    }

}