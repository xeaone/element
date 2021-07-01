import Statement from './statement';
import Batcher from './batcher';

import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import tasks from './tasks';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

const empty = /\s*{{\s*}}\s*/;

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

    async bind (node: Node, name: string, value: string, container: any) {
        const { compute, assignee, paths } = Statement(value, container.data);

        if (!paths.length) paths.push('');

        const owner = node.nodeType === AN ? (node as Attr).ownerElement : node;
        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const render = this.binders[ type ];

        const tasks = [];
        for (const path of paths) {
            const binder = {
                render,
                meta: {},
                node, owner,
                busy: false,
                container, type,
                compute, assignee,
                name, value, paths, path,
                // setup, before, read, write, after,
                get: this.get.bind(this),
                add: this.add.bind(this),
                adds: this.adds.bind(this),
                remove: this.remove.bind(this)
            };

            binder.render = render.bind(render, binder);

            if (path) {
                if (!this.nodeBinders.has(node)) this.nodeBinders.set(node, new Map());
                if (!this.pathBinders.has(path)) this.pathBinders.set(path, new Map());
                this.nodeBinders.get(node).set(path, binder);
                this.pathBinders.get(path).set(node, binder);
            }

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

    async adds (nodes: NodeList, container) {
        const tasks = [];
        for (const node of nodes) {
            tasks.push(this.add(node, container));
        }
        return Promise.all(tasks);
    }

    async add (node: Node, container: any) {
        const promises = [];
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
                // if (!empty.test(value))
                promises.push(this.bind(node, 'text', value, container));
                promises.push(this.add(split, container));
            } else {
                const value = node.textContent;
                node.textContent = '';
                // if (!empty.test(value))
                promises.push(this.bind(node, 'text', value, container));
            }

        } else if (type === EN) {
            const attributes = (node as Element).attributes;

            let each;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[ i ];
                const { name, value } = attribute;
                if (name === 'each' || name === `${this.prefix}each`) each = true;
                // this.syntaxMatch.test(name) || name.startsWith(this.prefix) 
                if (this.syntaxMatch.test(value)) {
                    attribute.value = '';
                    if (!empty.test(value)) promises.push(this.bind(attribute, name, value, container));
                }
            }

            if (!each) promises.push(this.adds(node.childNodes, container));

        }

        return Promise.all(promises);
    }

};
