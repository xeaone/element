import { traverse } from './tool';

import Expression from './expression';
import Batcher from './batcher';

import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';

// const PIPE = /\s?\|\s?/;
// const PIPES = /\s?,\s?|\s+/;
// const PATH = /\s?,\s?|\s?\|\s?|\s+/;
// const VARIABLE_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
// const PATH_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
// const PARAMETER_PATTERNS = /{{[._$a-zA-Z0-9,\(\)\[\] ]+}}/g;
// const eachPattern = /^\s*[._$a-zA-Z0-9\[\]]+\s+of\s+/;
// const Instructions = /(?!\B("|'|`)[^"'`]*)\s*\)*\s*[,\(]\s*(?![^`'"]*(`|'|")\B)/g;
// const isEach = /.*?\s+(of|in)\s+/;

const isNative = /^NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9.]+?$/;
const isSyntaxNative = /^\{\{NaN|true|false|null|undefined|\'.*?\'|\".*?\"|\`.*?\`|[0-9]+(\.[0-9]+)?\}\}$/;

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

interface Binders {
    setup?: () => Promise<void>;
    before?: () => Promise<void>;
    read?: () => Promise<void>;
    write?: () => Promise<void>;
    after?: () => Promise<void>;
}
interface Options {
    binders?: Binders;
}

export default new class Binder {

    prefix = 'o-';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');
    data: Map<Node, any> = new Map();
    // data: Map<Node | Attr, any> = new Map();

    binders = {
        checked,
        standard,
        value,
        each,
        html,
        text,
        on,
    };

    async setup (options: Options = {}) {
        const { binders } = options;
        for (const name in binders) {
            if (name in this.binders === false) {
                this.binders[ name ] = binders[ name ];
            }
        }
    }

    get (pointer: Node) {
        return this.data.get(pointer);
    }

    async unbind (pointer: Node) {
        return this.data.delete(pointer);
    }

    async bind (target: Node, name: string, value: string, container: any, pointer: Node) {

        // if (isSyntaxNative.test(value)) {
        //     target.textContent = value.replace(/\{\{\'?\`?\"?|\"?\`?\'?\}\}/g, '');
        //     return;
        // }

        const { compute, paths } = Expression(value, container.data);
        if (!paths.length && pointer.nodeType === AN) (pointer as Attr).value = await compute();
        else if (!paths.length) target.textContent = await compute();

        console.log(paths);

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const { setup, before, read, write, after } = this.binders[ type ];

        return Promise.all(paths.map(path => {
            if (isNative.test(path)) return;

            const keys = path.split('.');
            const [ key ] = keys.slice(-1);
            const childKey = keys.slice(-1)[ 0 ];
            const parentKeys = keys.slice(0, -1);

            const binder = {
                meta: {},
                busy: false,
                bindings: this.data,
                get: this.get.bind(this),
                add: this.add.bind(this),
                remove: this.remove.bind(this),
                target, container,
                compute, type, path,
                childKey, parentKeys,
                key, keys, name, value,
                setup, before, read, write, after,
                async render (...args) {
                    const context = {};
                    if (binder.before) await binder.before(binder, context, ...args);
                    const read = binder.read?.bind(null, binder, context, ...args);
                    const write = binder.write?.bind(null, binder, context, ...args);
                    if (read || write) await Batcher.batch(read, write);
                    if (binder.after) await binder.after(binder, context, ...args);
                },
                get data () {
                    const parentValue = traverse(this.container.data, this.parentKeys);
                    return parentValue?.[ this.childKey ];
                },
                set data (value: any) {
                    const parentValue = traverse(this.container.data, this.parentKeys);
                    parentValue[ this.childKey ] = value;
                }
            };

            if (this.data.has(pointer)) {
                console.warn('duplicate pointers', pointer);
            }

            this.data.set(pointer, binder);
            return binder.setup ? binder.setup(binder).then(binder.render) : binder.render();

            // if (target.nodeName.includes('-')) {
            //     window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            // } else {
            //     this.render(binder);
            // }
        }));
    }

    async remove (node: Node) {
        const type = node.nodeType;

        if (type === EN) {
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
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

        if (type === TN) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxStart.length !== node.textContent.length) {
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                const value = node.textContent;
                node.textContent = '';
                await this.bind(node, 'text', value, container, node);
                return this.add(split, container);
            } else {
                const value = node.textContent;
                node.textContent = '';
                return this.bind(node, 'text', value, container, node);
            }

        } else if (type === EN) {

            const tasks = [];
            const attributes = (node as Element).attributes;

            let each;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name, value } = attribute;
                if (name === 'each' || name === `${this.prefix}each`) {
                    each = await this.bind(node, name, value, container, attribute);
                    break;
                }
            }

            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name, value } = attribute;
                if (
                    name.startsWith(this.prefix) ||
                    (name.includes(this.syntaxStart) && name.includes(this.syntaxEnd)) ||
                    (value.includes(this.syntaxStart) && value.includes(this.syntaxEnd))
                ) {
                    if (name === 'each' || name === `${this.prefix}each`) {
                        continue;
                    } else {
                        tasks.push(this.bind(node, name, value, container, attribute));
                    }
                }
            }

            if (each) return Promise.all(tasks);

            let child = node.firstChild;
            while (child) {
                tasks.push(this.add(child, container));
                child = child.nextSibling;
            }

            return Promise.all(tasks);
        }
    }

};
