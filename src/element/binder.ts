import XElement from './element';
import Parse from './parse'

type Compute = (context: Record<string, any>, instance: Record<string, any>) => any;

// const referenceNormalize = /\s*(\??\.|\[\s*([0-9]+)\s*\])\s*/g;
// const referenceMatch = new RegExp([
//     '(".*?[^\\\\]*"|\'.*?[^\\\\]*\'|`.*?[^\\\\]*`)', // string
//     '((?:^|}}).*?{{)',
//     '(}}.*?(?:{{|$))',
//     `(
//         (?:\\$context|\\$instance|\\$assign|\\$event|\\$value|\\$checked|\\$form|\\$e|\\$v|\\$c|\\$f|
//         event|this|window|document|console|location|navigation|
//         globalThis|Infinity|NaN|undefined|
//         isFinite|isNaN|parseFloat|parseInt|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|
//         Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|
//         Object|Function|Boolean|Symbole|Array|
//         Number|Math|Date|BigInt|
//         String|RegExp|
//         Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
//         Int32Array|Uint32Array|BigInt64Array|BigUint64Array|Float32Array|Float64Array|
//         Map|Set|WeakMap|WeakSet|
//         ArrayBuffer|SharedArrayBuffer|DataView|Atomics|JSON|
//         Promise|GeneratorFunction|AsyncGeneratorFunction|Generator|AsyncGenerator|AsyncFunction|
//         Reflect|Proxy|
//         true|false|null|of|in|do|if|for|new|try|case|else|with|await|break|catch|class|super|throw|while|
//         yield|delete|export|import|return|switch|default|extends|finally|continue|debugger|function|arguments|typeof|instanceof|void)
//         (?:(?:[.][a-zA-Z0-9$_.? ]*)?\\b)
//     )`,
//     '(\\b[a-zA-Z$_][a-zA-Z0-9$_.? ]*\\b)' // reference
// ].join('|').replace(/\s|\t|\n/g, ''), 'g');

// const splitPattern = /\s*{{\s*|\s*}}\s*/;
// const bracketPattern = /({{)|(}})/;
// const stringPattern = /(".*?[^\\]*"|'.*?[^\\]*'|`.*?[^\\]*`)/;
// const assignmentPattern = /({{(.*?)([_$a-zA-Z0-9.?\[\]]+)([-+?^*%|\\ ]*=[-+?^*%|\\ ]*)([^<>=].*?)}})/;
// const codePattern = new RegExp(`${stringPattern.source}|${assignmentPattern.source}|${bracketPattern.source}`, 'g');

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

    static cache: Map<string, any> = new Map();
    static referenceCache: Map<string, Array<string>> = new Map();
    static computeCache: Map<string, Compute> = new Map();

    type: string;
    name: string;
    value: string;

    context: Record<string, any>;
    rewrites: Array<Array<string>>;

    code?: string;
    owner?: Element;

    node: Node;
    container: XElement;
    references: Set<string>;
    // references: Set<string> = new Set();

    compute: () => any;

    meta: Record<string, any> = {};
    instance: Record<string, any> = {};

    release: XElement[ 'release' ];
    register: XElement[ 'register' ];

    constructor (node: Node, container: XElement, context: Record<string, any>, rewrites?: Array<Array<string>>) {

        this.node = node;
        this.context = context;
        this.container = container;
        this.value = node.nodeValue ?? '';
        this.rewrites = rewrites ? [ ...rewrites ] : [];
        this.name = node.nodeName.startsWith('#') ? node.nodeName.slice(1) : node.nodeName;

        this.owner = (node as Attr).ownerElement ?? undefined;
        this.release = this.container.release.bind(this.container);
        this.register = this.container.register.bind(this.container);
        this.type = this.name.startsWith('on') ? 'on' : (this.constructor as any).handlers.includes(this.name) ? this.name : 'standard';

        this.node.nodeValue = '';

        // if (!(this.constructor as any).referenceCache.has(this.value)) {
        //     (this.constructor as any).referenceCache.set(this.value, new Set());
        // }

        const cache = Binder.cache.get(this.value);

        if (cache) {
            const { references, compute } = cache;
            // console.log(cache)

            if (rewrites) {
                this.references = new Set();
                for (const reference of references) {
                    for (const [ name, value ] of rewrites) {
                        if (reference === name) {
                            this.references.add(value);
                        } else if (reference.startsWith(name + '.')) {
                            this.references.add(value + reference.slice(name.length));
                        } else {
                            this.references.add(reference);
                        }
                    }
                }
            } else {
                this.references = new Set(references);
            }

            this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);
        } else {
            const { references, code, assignmentLeft, assignmentMid, assignmentRight } = Parse(this.value);
            const isValue = this.name === 'value';
            const isChecked = this.name === 'checked';
            const assignment = assignmentLeft && assignmentMid && assignmentRight;

            this.code =
                (assignment && isValue ? `$value = $assign ? $value : ${assignmentLeft};\n` : '') +
                (assignment && isChecked ? `$checked = $assign ? $checked : ${assignmentLeft};\n` : '') +
                `return ${assignment ? `$assign ? ${code} : ${assignmentRight}` : code};`;

            this.code = `
            try {
                with ($context) {
                    with ($instance) {
                        ${this.code}
                    }
                }
            } catch (error){
                console.error(error);
            }
            `;

            const compute = new Function('$context', '$instance', this.code) as Compute;

            if (rewrites) {
                this.references = new Set();
                for (const reference of references) {
                    for (const [ name, value ] of rewrites) {
                        if (reference === name) {
                            this.references.add(value);
                        } else if (reference.startsWith(name + '.')) {
                            this.references.add(value + reference.slice(name.length));
                        } else {
                            this.references.add(reference);
                        }
                    }
                }
            } else {
                this.references = new Set(references);
            }

            // console.log(this.code, this.references)

            this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);

            Binder.cache.set(this.value, { references, compute });
        }

        // const referenceCache = (this.constructor as any).referenceCache.get(this.value);

        // if (referenceCache.size) {
        //     if (rewrites) {
        //         for (const reference of referenceCache) {
        //             for (const [ name, value ] of rewrites) {
        //                 if (reference === name) {
        //                     this.references.add(value);
        //                 } else if (reference.startsWith(name + '.')) {
        //                     this.references.add(value + reference.slice(name.length));
        //                 } else {
        //                     this.references.add(reference);
        //                 }
        //             }
        //         }
        //     } else {
        //         this.references = referenceCache;
        //     }
        // } else {
        //     const data = this.value;

        //     let match = referenceMatch.exec(data);
        //     while (match) {
        //         const reference = match[ 5 ];
        //         if (reference) {
        //             referenceCache.add(reference);

        //             if (rewrites) {
        //                 for (const [ name, value ] of rewrites) {
        //                     if (reference === name) {
        //                         this.references.add(value);
        //                     } else if (reference.startsWith(name + '.')) {
        //                         this.references.add(value + reference.slice(name.length));
        //                     } else {
        //                         this.references.add(reference);
        //                     }
        //                 }
        //             } else {
        //                 this.references.add(reference);
        //             }

        //         }
        //         match = referenceMatch.exec(data);
        //     }

        // }

        // const compute = (this.constructor as any).computeCache.get(this.value);
        // if (compute) {
        //     this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);
        // } else {
        //     let reference = '';
        //     let assignment = '';
        //     this.code = this.value;

        //     const isValue = this.name === 'value';
        //     const isChecked = this.name === 'checked';
        //     const convert = this.code.split(splitPattern).filter((part: string) => part).length > 1;

        //     this.code = this.code.replace(codePattern, (_, str: string, assignee: string, assigneeLeft: string, r: string, assigneeMiddle: string, assigneeRight: string, bracketLeft: string, bracketRight: string) => {
        //         if (str) return str;
        //         if (bracketLeft) return convert ? `' + (` : '(';
        //         if (bracketRight) return convert ? `) + '` : ')';
        //         if (assignee) {
        //             if (isValue || isChecked) {
        //                 reference = r;
        //                 assignment = assigneeLeft + assigneeRight;
        //             }
        //             return (convert ? `' + (` : '(') + assigneeLeft + r + assigneeMiddle + assigneeRight + (convert ? `) + '` : ')');
        //         }
        //         console.warn('possible compute issue');
        //         return '';
        //     }) ?? '';

        //     this.code = convert ? `'${this.code}'` : this.code;

        //     this.code =
        //         (reference && isValue ? `$value = $assign ? $value : ${reference};\n` : '') +
        //         (reference && isChecked ? `$checked = $assign ? $checked : ${reference};\n` : '') +
        //         `return ${assignment ? `$assign ? ${this.code} : ${assignment}` : `${this.code}`};`;

        //     this.code = `
        //     try {
        //         with ($context) {
        //             with ($instance) {
        //                 ${this.code}
        //             }
        //         }
        //     } catch (error){
        //         console.error(error);
        //     }
        //     `;

        //     const compute = new Function('$context', '$instance', this.code) as Compute;
        //     (this.constructor as any).computeCache.set(this.value, compute);
        //     this.compute = compute.bind(this.owner ?? this.node, this.context, this.instance);
        // }

    }

}