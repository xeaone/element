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

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

const tick = Promise.resolve();

export default class Binder {

    prefix = 'o-';
    prefixEach = 'o-each';
    prefixValue = 'o-value';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    syntaxLength = 2;
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

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

        const assignee = () => {
            if (!parsed.assignees[ 0 ]) return;
            let result = context;
            const parts = parsed.assignees[ 0 ].split('.');
            for (const part of parts) {
                if (typeof result !== 'object') return;
                result = result[ part ];
            }
            return result;
        };

        const paths = parsed.references;

        const binder = {
            render: undefined,
            binder: this, meta: {},
            // busy: false,
            type,
            assignee,
            compute, paths,
            node, owner, name, value,
            dynamics, rewrites, context,
            container,
        };

        (node as any).$binder = binder;
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

        tick.then(binder.render.bind());
        // return binder.render();
    };

    async remove (node: Node) {
        // const tasks = []

        if (node.nodeType === AN || node.nodeType === TN) {
            tick.then(this.unbind.bind(this, node));
            // tasks.push(this.unbind(node));
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                tick.then(this.unbind.bind(this, attribute));
                // tasks.push(this.unbind(attribute));
            }

            let child = node.firstChild;
            while (child) {
                // tasks.push(this.remove(child));
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
                (node as any).$bound = true;
                tick.then(this.bind.bind(this, node, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
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
                // tasks.push(this.add(split, container, dynamics, rewrites));
                tick.then(this.add.bind(this, split, container, dynamics, rewrites));
            }

            (node as any).$bound = true;
            // tasks.push(this.bind(node, container, 'text', node.nodeValue, node, dynamics, rewrites));
            tick.then(this.bind.bind(this, node, container, 'text', node.nodeValue, node, dynamics, rewrites));
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            let each = false;

            for (const attribute of attributes) {
                if (this.syntaxMatch.test(attribute.value)) {
                    (node as any).$bound = true;
                    if (attribute.name === 'each' || attribute.name === this.prefixEach) each = true;
                    // tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                    tick.then(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics, rewrites));
                    attribute.value = '';
                    // } else if (attribute.name === 'value' && node.nodeName === 'OPTION') {
                    // tick.then(this.bind.bind(this, attribute, container, attribute.name, `{{'${attribute.value}'}}`, attribute.ownerElement));
                    // } else if (attribute.name === 'value' && node.nodeName === 'SELECT') {
                    // tick.then(this.bind.bind(this, attribute, container, attribute.name, `{{'$value ?? ${attribute.value}'}}`, attribute.ownerElement));
                }
            }

            if (each) return;
            // if (each) return Promise.all(tasks);

            let child = node.firstChild;
            while (child) {
                // tasks.push(this.add(child, container, dynamics, rewrites));
                tick.then(this.add.bind(this, child, container, dynamics, rewrites));
                child = child.nextSibling;
            }

        }

        // return Promise.all(tasks);
    }

};
