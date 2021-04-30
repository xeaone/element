import { traverse } from './tool';

import Batcher from './batcher';

import checked from './binder/checked';
// import Class from './binder/class';
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

const isEach = /.*?\s+(of|in)\s+/;
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

    // async render (binder: any, ...extra) {

    //     if (binder.busy) return;
    //     else binder.busy = true;

    //     const type = binder.type in this.binders ? binder.type : 'default';
    //     const render = this.binders[ type ](binder, ...extra);

    //     if (render) {
    //         const context = {};
    //         Batcher.batch(async () => {
    //             if (render.read) await render.read(context);
    //         }, async () => {
    //             if (render.write) await render.write(context);
    //             binder.busy = false;
    //         });
    //     }
    // }

    async unbind (node: Node) {
        return this.data.delete(node);
    }

    async bind (target: Node, name: string, value: string, container: any, pointer: Node | Attr) {
        const self = this;

        if (isSyntaxNative.test(value)) {
            target.textContent = value.replace(/\{\{\'?\`?\"?|\"?\`?\'?\}\}/g, '');
            return;
        }

        const { compute, paths } = Expression(value, container.data);
        const type = name.startsWith('on') ? 'on' : name in self.binders ? name : 'default';
        const action = self.binders[ type ];

        const render = async function (...extra) {
            if (this.busy) return;
            else this.busy = true;

            const { read, write } = this.action(this, ...extra);
            const context = {};

            Batcher.batch(async () => {
                if (read) await read(context);
            }, async () => {
                if (write) await write(context);
                this.busy = false;
            });
        };

        // if ((name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1)) {
        //     const nameTree = Expression(name, container.data);
        //     const nameResult = nameTree.execute();
        //     (target as Element).removeAttribute(name);
        //     (target as Element).setAttribute(nameResult, '');
        //     pointer = (target as Element).getAttributeNode(nameResult);
        //     console.log(target);
        //     console.log(pointer);
        //     return;
        // }

        for (const path of paths) {
            if (isNative.test(path)) continue;

            const keys = path.split('.');
            const [ key ] = keys.slice(-1);
            const childKey = keys.slice(-1)[ 0 ];
            const parentKeys = keys.slice(0, -1);

            const binder = {
                meta: {},
                busy: false,
                compute,
                path,
                key, keys,
                name, value,
                childKey, parentKeys,
                type,
                target,
                container,
                action,
                render,
                // getAttribute (name: string) {
                //     const node = (target as any).getAttributeNode(name);
                //     if (!node) return undefined;
                //     const data = (self.data?.get(node) as any)?.data;
                //     return data === undefined ? node.value : data;
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
            };

            this.data.set(pointer, binder);
            binder.render();

            // if (target.nodeName.includes('-')) {
            //     window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            // } else {
            //     this.render(binder);
            // }
            // return path;
        }

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

            const binds = [];
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
                        binds.unshift(this.bind.bind(this, node, name, value, container, attribute));
                    } else {
                        binds.push(this.bind.bind(this, node, name, value, container, attribute));
                    }
                }
            }

            // for (const bind of binds) bind();
            await Promise.all(binds.map(bind => bind()));

            if (skip) return;

            let child = node.firstChild;
            while (child) {
                this.add(child, container);
                child = child.nextSibling;
            }

        }
    }

};
