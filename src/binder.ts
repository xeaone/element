import { traverse } from './tool';

import Batcher from './batcher';

import checked from './binder/checked';
import Class from './binder/class';
import Default from './binder/default';
import each from './binder/each';
import html from './binder/html';
import on from './binder/on';
import text from './binder/text';
import value from './binder/value';
import Expression from './expression';

// const PIPE = /\s?\|\s?/;
// const PIPES = /\s?,\s?|\s+/;
// const PATH = /\s?,\s?|\s?\|\s?|\s+/;
// const VARIABLE_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
// const PATH_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
const PARAMETER_PATTERNS = /{{[._$a-zA-Z0-9,\(\)\[\] ]+}}/g;
// const eachPattern = /^\s*[._$a-zA-Z0-9\[\]]+\s+of\s+/;
const Instructions = /(?!\B("|'|`)[^"'`]*)\s*\)*\s*[,\(]\s*(?![^`'"]*(`|'|")\B)/g;
const eachPattern = /.*?\s+(of|in)\s+/;

const isNative = /^NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9.]+?$/;
const isSyntaxNative = /^\{\{NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9]+(\.[0-9]+)?\}\}$/;

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

export default new class Binder {

    data: Map<Node, any> = new Map();

    prefix = 'o-';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    binders = {
        checked,
        // class: Class,
        default: Default,
        each,
        html,
        on,
        text,
        value
    };

    async setup (options: any = {}) {
        const { binders } = options;
        if (binders) {
            for (const name in binders) {
                if (name in this.binders === false) {
                    this.binders[ name ] = binders[ name ].bind(this);
                }
            }
        }
    }

    get (node) {
        return this.data.get(node);
    }

    async render (binder: any, ...extra) {

        if (binder.busy) return;
        else binder.busy = true;

        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[ type ](binder, ...extra);

        if (render) {
            const context = {};
            Batcher.batch(async () => {
                if (render.read) await render.read(context);
            }, async () => {
                if (render.write) await render.write(context);
                binder.busy = false;
            });
        }
    }

    async unbind (node: Node) {
        return this.data.delete(node);
    }

    async bind (target: Node, name: string, value: string, container: any, pointer: Node | Attr) {
        const self = this;

        if (isSyntaxNative.test(value)) {
            target.textContent = value.replace(/\{\{\'?\`?\"?|\"?\`?\'?\}\}/g, '');
            return;
        }

        // const parameters = value.match(PARAMETER_PATTERNS);
        // if (!parameters) return console.error(`Oxe.binder.bind - value ${value} is not valid`);

        const type = name.startsWith('on') ? 'on' : name;
        // const expression = Expression(value, container.data);

        const tree = Expression(value, container.data);

        // for (let index = 0; index < parameters.length; index++) {
        // let parameter = parameters[ index ].replace(this.syntaxReplace, '');
        // const args = parameter.replace(eachPattern, '').split(Instructions);

        // const args = [];
        // if (parameter.includes(')')) {
        //     args.push(...parameter.replace(/.*?\((.*?)\)/, '$1').split(/\s*,\s*/));
        //     parameter = parameter.replace(/\(.*?\)/, '');
        // }

        // if (parameter.includes(' of ') || parameter.includes(' in ')) {
        //     parameter = parameter.replace(eachPattern, '');
        // }

        // const paths = [parameter];
        for (const path of tree.paths) {
            // for (const path of args) {
            if (isNative.test(path)) continue;

            const keys = path.split('.');
            const [ key ] = keys.slice(-1);
            // const parameter = parameters[ index ];
            const childKey = keys.slice(-1)[ 0 ];
            const parentKeys = keys.slice(0, -1);

            const binder = Object.freeze({

                meta: {},
                _meta: { busy: false },
                get busy () { return this._meta.busy; },
                set busy (busy) { this._meta.busy = busy; },

                expression: tree.execute,

                // args,
                path,
                key, keys,
                name, value,
                childKey, parentKeys,
                // parameter, parameters,

                type,
                target,
                container,
                render: self.render,
                getAttribute (name: string) {
                    const node = (target as any).getAttributeNode(name);
                    if (!node) return undefined;
                    const data = (self.data?.get(node) as any)?.data;
                    return data === undefined ? node.value : data;
                },
                // display (data: any) {
                //     if (data === null || data === undefined) return '';
                //     let value = this.value;
                //     this.parameters.forEach(parameter => {
                //         value = value.replace(
                //             parameter, parameter === this.parameter ?
                //             data :
                //             this.parse(parameter.replace(self.syntaxReplace, ''))
                //         );
                //     });
                //     return value;
                // },
                // parse (arg) {
                //     if (arg === 'NaN') return NaN;
                //     if (arg === 'null') return null;
                //     if (arg === 'true') return true;
                //     if (arg === 'false') return false;
                //     if (arg === 'undefined') return undefined;
                //     if (/^[0-9]+(\.[0-9]+)?$/.test(arg)) return Number(arg);
                //     if (/^("|'|`).*?(`|'|")$/.test(arg)) return arg.slice(1, -1);
                //     return traverse(this.container.data, arg);
                // },
                get data () {
                    const parentValue = traverse(this.container.data, this.parentKeys);
                    const childValue = parentValue?.[ this.childKey ];

                    if (typeof childValue === 'function') {
                        return event => {
                            const args = this.args.map(arg => this.parse(arg, this.container.data));
                            if (event) args.unshift(event);
                            return childValue.apply(this.container, args);
                        };
                    } else {
                        return childValue;
                    }
                },
                set data (value: any) {
                    const parentValue = traverse(this.container.data, this.parentKeys);
                    const childValue = parentValue?.[ this.childKey ];

                    if (typeof childValue === 'function') {
                        parentValue[ this.childKey ] = event => {
                            const args = this.args.map(arg => this.parse(arg, this.container.data));
                            if (event) args.unshift(event);
                            return childValue.apply(this.container, args);
                        };
                    } else {
                        parentValue[ this.childKey ] = value;
                    }
                }
            });

            this.data.set(pointer, binder);
            this.render(binder);

            // if (target.nodeName.includes('-')) {
            //     window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            // } else {
            //     this.render(binder);
            // }
            // return path;
        }

        // }

    }

    async remove (node: Node) {
        const type = node.nodeType;

        if (type === EN) {
            const attributes = (node as Element).attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                this.unbind(attribute);
            }
        }

        this.unbind(node);

        let child = node.firstChild;
        while (child) {
            this.remove(child);
            child = child.nextSibling;
        }

    }

    async add (node: Node, container: any) {
        const type = node.nodeType;

        // if (type === AN) {
        //     if (node.name.indexOf(this.prefix) === 0) {
        //         this.bind(node, node.name, node.value, container, attribute);
        //     }
        // } else

        if (type === TN) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            // if (start !== 0) node = node.splitText(start);
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxStart.length !== node.textContent.length) {
                // const split = node.splitText(end + this.syntaxEnd.length);
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                this.bind(node, 'text', node.textContent, container, node);
                this.add(split, container);
            } else {
                this.bind(node, 'text', node.textContent, container, node);
            }

        } else if (type === EN) {
            let skip = false;

            const attributes = (node as Element).attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name, value } = attribute;

                if (
                    name.indexOf(this.prefix) === 0 ||
                    (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1) ||
                    (value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1)
                ) {

                    if (
                        name.indexOf('each') === 0
                        ||
                        name.indexOf(`${this.prefix}each`) === 0
                    ) {
                        skip = true;
                    }

                    this.bind(node, name, value, container, attribute);
                }

            }

            if (skip) return;

            let child = node.firstChild;
            while (child) {
                this.add(child, container);
                child = child.nextSibling;
            }

        }
    }

};
