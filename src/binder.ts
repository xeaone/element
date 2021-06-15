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

    get (node: Node) {
        return this.data.get(node);
    }

    async unbind (node: Node) {
        return this.data.delete(node);
    }

    async bind (node: Node, name: string, value: string, container: any) {

        // if (isSyntaxNative.test(value)) {
        //     target.textContent = value.replace(/\{\{\'?\`?\"?|\"?\`?\'?\}\}/g, '');
        //     return;
        // }
        const owner = node.nodeType === AN ? (node as Attr).ownerElement : node;

        const { assignee, compute, paths } = Expression(value, container.data);

        if (paths.length === 0) {
            if (node.nodeType === AN) return (node as Attr).value = await compute();
            if (node.nodeType === TN) return node.textContent = await compute();
            else console.log('node type not handle path length 0');
        }

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const { setup, before, read, write, after } = this.binders[ type ];

        return Promise.all(paths.map(async path => {

            // const keys = path.split('.');
            const keys = path.replace(/\?\.|\]/g, '').replace(/\[/g, '.').split('.');

            const [ key ] = keys.slice(-1);
            const childKey = keys.slice(-1)[ 0 ];
            const parentKeys = keys.slice(0, -1);

            const binder = {
                target: owner,
                node, owner,

                meta: {},
                busy: false,
                bindings: this.data,
                get: this.get.bind(this),
                add: this.add.bind(this),
                remove: this.remove.bind(this),
                container,
                assignee, compute, type, path,
                childKey, parentKeys,
                key, keys, name, value,
                setup, before, read, write, after,
                async render (...args) {
                    if (binder.busy) return;
                    else binder.busy = true;
                    const context = {};
                    // if (binder.before) await binder.before(binder, context, ...args);
                    const read = binder.read?.bind(null, binder, context, ...args);
                    const write = binder.write?.bind(null, binder, context, ...args);
                    if (read || write) await Batcher.batch(read, write);
                    binder.busy = false;
                    // if (binder.after) await binder.after(binder, context, ...args);
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

            const duplicate = this.data.get(node);
            if (duplicate && duplicate.path === path) {
                console.warn('duplicate binders', node, path);
            }

            this.data.set(node, binder);

            if (binder.setup) await binder.setup(binder);

            return binder.render();

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
                await this.bind(node, 'text', value, container);
                return this.add(split, container);
            } else {
                const value = node.textContent;
                node.textContent = '';
                return this.bind(node, 'text', value, container);
            }

        } else if (type === EN) {

            const tasks = [];
            const attributes = (node as Element).attributes;

            let each;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name, value } = attribute;
                if (name === 'each' || name === `${this.prefix}each`) {
                    each = await this.bind(attribute, name, value, container);
                    // each = await this.bind(node, name, value, container, attribute);
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
                        tasks.push(this.bind(attribute, name, value, container));
                        // tasks.push(this.bind(node, name, value, container, attribute));
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
