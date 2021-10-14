import standard from './binder/standard';
import checked from './binder/checked';
import inherit from './binder/inherit';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import computer from './computer';
import parser from './parser';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

console.warn('todo:unbind to handle boolean attributes');

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

    nodeBinders: Map<Node, any> = new Map();
    ownerBinders: Map<Node, Set<any>> = new Map();
    pathBinders: Map<string, Set<any>> = new Map();

    binders = {
        standard,
        checked,
        inherit,
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
        const ownerBinders = this.ownerBinders.get(node);
        if (!ownerBinders) return;

        for (const ownerBinder of ownerBinders) {
            this.nodeBinders.delete(ownerBinder.node);
            for (const path of ownerBinder.paths) {
                const pathBinders = this.pathBinders.get(path);
                pathBinders.delete(ownerBinder);
                if (!pathBinders.size) this.pathBinders.delete(path);
            }
        }

        this.nodeBinders.delete(node);
        this.ownerBinders.delete(node);
    }

    async bind (node: Node, container: any, name, value, owner, context: any, rewrites?: any) {

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const handler = this.binders[ type ];
        const parsed = parser(value, rewrites);

        const binder = {
            meta: {},
            ready: true,
            binder: this,
            compute: undefined,
            render: undefined,
            unrender: undefined,
            paths: parsed.references,
            binders: this.pathBinders,
            node, owner, name, value, rewrites, context, container, type,
        };

        binder.compute = computer(binder);
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);

        for (const reference of parsed.references) {
            const binders = binder.binders.get(reference);
            if (binders) {
                binders.add(binder);
            } else {
                binder.binders.set(reference, new Set([ binder ]));
            }
        }

        this.nodeBinders.set(node, binder);

        const ownerBinders = this.ownerBinders.get(binder.owner);
        if (ownerBinders) {
            ownerBinders.add(binder);
        } else {
            this.ownerBinders.set(binder.owner, new Set([ binder ]));
        }

        return binder.render();
    };

    async remove (node: Node) {
        // const tasks = [];

        // if (node.nodeType === AN) {
        //     tasks.push(this.unbind(node));
        if (node.nodeType === TN) {
            this.unbind(node);
        } else if (node.nodeType === EN) {
            this.unbind(node);
            // const attributes = (node as Element).attributes;
            // for (const attribute of attributes) {
            //     tasks.push(this.unbind(attribute));
            // }

            let child = node.firstChild;
            while (child) {
                this.remove(child);
                // tasks.push(this.remove(child));
                child = child.nextSibling;
            }

        }

        // return Promise.all(tasks);
    }

    async add (node: Node, container: any, context: any, rewrites?: any) {
        const tasks = [];

        if (node.nodeType === AN) {
            const attribute = (node as Attr);
            if (this.syntaxMatch.test(attribute.value)) {
                // tasks.push(this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                tasks.push(this.bind.bind(this, node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
            }
        } else if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                // tasks.push(this.add(split, container, context, rewrites));
                tasks.push(this.add.bind(this, split, container, context, rewrites));
            }

            // tasks.push(this.bind(node, container, 'text', node.nodeValue, node, context, rewrites));
            tasks.push(this.bind.bind(this, node, container, 'text', node.nodeValue, node, context, rewrites));
        } else if (node.nodeType === EN) {

            let each;
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                if (this.syntaxMatch.test(attribute.value)) {
                    // if (each) {
                    //     if (attribute.name === 'each' || attribute.name === this.prefixEach) continue;
                    //     tasks.push(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                    // } else {
                    //     tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                    // }
                    if (each) continue;
                    if (attribute.name === 'each' || attribute.name === this.prefixEach) {
                        each = this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    } else {
                        tasks.push(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                    }
                }
            }

            if (each) return Promise.resolve().then(each).then(() => Promise.all(tasks.map(task => task())));

            let child = node.firstChild;
            if (child) {
                do {
                    // tasks.push(this.add(child, container, context, rewrites));
                    tasks.push(this.add.bind(this, child, container, context, rewrites));
                } while (child = child.nextSibling);
            }

        }

        return Promise.all(tasks.map(task => task()));
        // return Promise.all(tasks);
    }

};
