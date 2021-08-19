import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import computer from './computer';
import parser from './parser';
import contexter from './contexter';
import traverse from './traverse';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

const tick = Promise.resolve();

export default class Binder {

    prefix = 'o-';
    prefixEach = 'o-each';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    syntaxLength = 2;
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    // nodeBinders: Map<Node, Map<string, any>> = new Map();
    // pathBinders: Map<string, Map<Node, any>> = new Map();
    nodeBinders: Map<Node, Set<any>> = new Map();
    pathBinders: Map<string, Set<any>> = new Map();

    binders = {
        standard,
        checked,
        value,
        each,
        html,
        text,
        on,
    };

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

        for (const nodeBinder of nodeBinders) {
            for (const path of nodeBinder.paths) {
                this.pathBinders.get(path).delete(nodeBinder);
            }
        }

        this.nodeBinders.delete(node);
    }

    async bind (node: Node, container: any, name, value, owner, dynamics?: any, rewrites?: any) {
        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';

        const context = contexter(container.data, dynamics);
        const parsed = parser(value, rewrites);
        const compute = computer(value, context);
        const assignee = parsed.assignees[ 0 ] ? traverse.bind(null, context, parsed.assignees[ 0 ]) : () => undefined;

        const paths = parsed.references;

        const binder = {
            render: undefined,
            binder: this, meta: {}, busy: false,
            type,
            assignee,
            compute, paths,
            node, owner, name, value,
            dynamics, rewrites, context,
            container,
        };

        binder.render = this.binders[ type ].bind(null, binder);

        if (!this.nodeBinders.has(node)) {
            this.nodeBinders.set(node, new Set([ binder ]));
        } else {
            this.nodeBinders.get(node).add(binder);
        }

        for (const path of paths) {
            if (path) {
                if (!this.pathBinders.has(path)) {
                    this.pathBinders.set(path, new Set([ binder ]));
                } else {
                    this.pathBinders.get(path).add(binder);
                }
            }
        }

        tick.then(binder.render);
    };

    async remove (node: Node) {

        if (node.nodeType === AN || node.nodeType === TN) {
            tick.then(this.unbind.bind(this, node));
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                tick.then(this.unbind.bind(this, attribute));
            }

            let child = node.firstChild;
            while (child) {
                tick.then(this.remove.bind(this, child));
                child = child.nextSibling;
            }

        }

    }

    async add (node: Node, container: any, dynamics?: any, rewrites?: any) {
        // const tasks = [];

        if (node.nodeType === AN) {
            const attribute = (node as Attr);
            if (this.syntaxMatch.test(attribute.value)) {
                tick.then(this.bind.bind(this, node, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                // this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites);
                // tasks.push(this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
            }
        } else if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                tick.then(this.add.bind(this, split, container, dynamics, rewrites));
                // tasks.push(this.add(split, container, dynamics, rewrites));
                // this.add(split, container, dynamics, rewrites);
            }

            tick.then(this.bind.bind(this, node, container, 'text', node.nodeValue, node, dynamics, rewrites));
            // tasks.push(this.bind(node, container, 'text', node.nodeValue, node, dynamics, rewrites));
            // this.bind(node, container, 'text', node.nodeValue, node, dynamics, rewrites);
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            let each = false;
            // const each = attributes[ 'each' ] || attributes[ `${this.prefix}each` ];
            // if (each) await this.bind(each, container, each.name, each.value, each.ownerElement, dynamics, rewrites);

            for (const attribute of attributes) {
                if (attribute.name === 'each' || attribute.name === this.prefixEach) each = true;
                // if (attribute.name === 'each' || attribute.name === `${this.prefix}each`) continue;
                if (this.syntaxMatch.test(attribute.value)) {
                    tick.then(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                    attribute.value = '';
                    // tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                    // this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites);
                }
            }

            if (each) return;

            if (!each) {
                let child = node.firstChild;
                while (child) {
                    tick.then(this.add.bind(this, child, container, dynamics, rewrites));
                    // this.add(child, container, dynamics, rewrites);
                    // tasks.push(this.add(child, container, dynamics, rewrites));
                    child = child.nextSibling;
                }
            }

        }

        // return Promise.all(tasks);
    }

};
