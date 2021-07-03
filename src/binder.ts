import Statement from './statement';
import Batcher from './batcher';

import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

const emptyAttribute = /\s*{{\s*}}\s*/;
const emptyText = /\s+|(\\t)+|(\\r)+|(\\n)+|\s*{{\s*}}\s*|^$/;

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
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');
    // data: Map<Node, any> = new Map();

    nodeBinders: Map<Node, Map<string, any>> = new Map();
    pathBinders: Map<string, Map<Node, any>> = new Map();

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

    get (data: any) {
        if (typeof data === 'string') {
            return this.pathBinders.get(data);
        } else {
            return this.nodeBinders.get(data);
        }
    }

    async unbind (node: Node) {
        // need to figureout how to handle boolean attributes
        const nodeBinders = this.nodeBinders.get(node);
        if (!nodeBinders) return;

        for (const [ path ] of nodeBinders) {
            this.pathBinders.get(path).delete(node);
        }

        this.nodeBinders.delete(node);
    }

    async bind (node: Node, container: any, extra?: any) {

        const owner = node.nodeType === AN ? (node as Attr).ownerElement : node;
        const name = node.nodeType === AN ? (node as Attr).name : 'text';
        const value = node.nodeType === AN ? (node as Attr).value : node.textContent;

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const render = this.binders[ type ];

        const get = this.get.bind(this);
        const add = this.add.bind(this);
        const remove = this.remove.bind(this);

        const { compute, assignee, paths } = Statement(value, container.data, extra);
        if (!paths.length) paths.push('');

        const binder = {
            render,
            meta: {},
            node, owner,
            busy: false,
            container, type,
            assignee,
            name, value, paths,
            get, add, remove,
            compute
        };

        binder.render = render.bind(render, binder);

        const tasks = [];
        for (const path of paths) {

            if (path) {
                if (!this.nodeBinders.has(node)) this.nodeBinders.set(node, new Map());
                if (!this.pathBinders.has(path)) this.pathBinders.set(path, new Map());
                this.nodeBinders.get(node).set(path, binder);
                this.pathBinders.get(path).set(node, binder);
            }

            // binder.render();
            tasks.push(binder.render());
        }

        return Promise.all(tasks);
    };

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

    // async adds (node: Node, container, extra?) {
    //     const tasks = [];
    //     node = node.firstChild;
    //     if (!node) return;

    //     tasks.push(this.add(node, container, extra));
    //     while (node = node.nextSibling) {
    //         tasks.push(this.add(node, container, extra));
    //     }
    //     return Promise.all(tasks);
    // }

    async add (node: Node, container: any, extra?: any) {
        const type = node.nodeType;
        const tasks = [];

        if (type === AN) {
            const attribute = (node as Attr);
            const { value } = attribute;
            if (this.syntaxMatch.test(value)) {
                if (!emptyAttribute.test(value)) tasks.push(this.bind(attribute, container, extra));
                // if (!emptyAttribute.test(value)) tasks.push(this.bind(attribute, name, value, container, extra));
            }
        } else if (type === TN) {
            if (emptyText.test(node.textContent)) return;

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxStart.length !== node.textContent.length) {
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                // const value = node.textContent;
                // node.textContent = '';
                // if (!empty.test(value))
                // tasks.push(this.bind(node, 'text', value, container, extra));
                tasks.push(this.bind(node, container, extra));
                tasks.push(this.add(split, container, extra));
            } else {
                // const value = node.textContent;
                // node.textContent = '';
                // if (!empty.test(value))
                // tasks.push(this.bind(node, 'text', value, container, extra));
                tasks.push(this.bind(node, container, extra));
            }

        } else if (type === EN) {
            const attributes = (node as Element).attributes;

            let each;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name } = attribute;
                // const { name, value } = attribute;
                if (name === 'each' || name === `${this.prefix}each`) each = true;
                tasks.push(this.add(attribute, container, extra));
                // if (this.syntaxMatch.test(value)) {
                //     attribute.value = '';
                //     if (!emptyAttribute.test(value)) tasks.push(this.bind(attribute, name, value, container, extra));
                // }
            }

            if (!each) {
                node = node.firstChild;
                while (node) {
                    tasks.push(this.add(node, container, extra));
                    node = node.nextSibling;
                }
            }

        }

        Promise.all(tasks);
    }

    async walk (node: Node, handle) {
        const type = node.nodeType;
        const tasks = [];

        if (type === AN) {
            const attribute = (node as Attr);
            const { value } = attribute;
            if (this.syntaxMatch.test(value)) {
                attribute.value = '';
                if (!emptyAttribute.test(value)) tasks.push(handle(attribute));
            }
        } else if (type === TN) {
            if (emptyText.test(node.textContent)) return;

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxStart.length !== node.textContent.length) {
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                node.textContent = '';
                tasks.push(handle(node));
                tasks.push(this.walk(split, handle));
            } else {
                tasks.push(handle(node));
            }

        } else if (type === EN) {
            const attributes = (node as Element).attributes;

            let each;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name } = attribute;
                if (name === 'each' || name === `${this.prefix}each`) each = true;
                tasks.push(this.walk(attribute, handle));
            }

            if (!each) {
                node = node.firstChild;
                while (node) {
                    tasks.push(this.walk(node, handle);
                    node = node.nextSibling;
                }
            }

        }

        Promise.all(tasks);
    }

};
