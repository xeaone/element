import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import computer from './computer';
// import parser from './parser';

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

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

    async bind (node: Node, container: any, name, value, owner, context: any, rewrites?: any) {

        const binder = {
            paths: new Set(),
            render: undefined,
            binder: this,
            meta: {},
            type: name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard',
            binders: this.pathBinders,
            assignee: () => {
                return undefined;
                // if (!parsed.sets[ 0 ]) return;
                // let result = context;
                // const parts = parsed.sets[ 0 ].split('.');
                // for (const part of parts) {
                //     if (typeof result !== 'object') return;
                //     result = result[ part ];
                // }
                // return result;
            },
            compute: undefined,
            node, owner, name, value,
            rewrites, context,
            container,
        };

        (node as any).$binder = binder;
        binder.compute = computer(binder);
        binder.render = this.binders[ binder.type ].bind(null, binder);

        // if (!this.nodeBinders.has(node)) {
        //     this.nodeBinders.set(node, new Set([ binder ]));
        // } else {
        //     this.nodeBinders.get(node).add(binder);
        // }

        // for (const path of parsed.gets) {
        //     if (path) {
        //         if (!this.pathBinders.has(path)) {
        //             this.pathBinders.set(path, new Set([ binder ]));
        //         } else {
        //             this.pathBinders.get(path).add(binder);
        //         }
        //     }
        // }

        return binder.render();
    };

    async remove (node: Node) {
        const tasks = [];

        if (node.nodeType === AN || node.nodeType === TN) {
            // this.unbind(node);
            tasks.push(this.unbind(node));
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                // this.unbind(attribute);
                tasks.push(this.unbind(attribute));
            }

            let child = node.firstChild;
            while (child) {
                tasks.push(this.remove(child));
                // this.remove(child);
                child = child.nextSibling;
            }

        }

        return Promise.all(tasks);
    }

    async add (node: Node, container: any, context: any, rewrites?: any) {
        const tasks = [];

        if (node.nodeType === AN) {
            const attribute = (node as Attr);
            if (this.syntaxMatch.test(attribute.value)) {
                (node as any).$bound = true;
                // this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                tasks.push(this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
            }
        } else if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                tasks.push(this.add(split, container, context, rewrites));
                // this.add(split, container, context, rewrites);
            }

            (node as any).$bound = true;
            tasks.push(this.bind(node, container, 'text', node.nodeValue, node, context, rewrites));
            // this.bind(node, container, 'text', node.nodeValue, node, context, rewrites);
        } else if (node.nodeType === EN) {
            let each = false;

            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                if (this.syntaxMatch.test(attribute.value)) {
                    (node as any).$bound = true;
                    if (attribute.name === 'each' || attribute.name === this.prefixEach) each = true;
                    tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                    // this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    // } else if (attribute.name === 'value' && node.nodeName === 'OPTION') {
                    // tick.then(this.bind.bind(this, attribute, container, attribute.name, `{{'${attribute.value}'}}`, attribute.ownerElement));
                    // } else if (attribute.name === 'value' && node.nodeName === 'SELECT') {
                    // tick.then(this.bind.bind(this, attribute, container, attribute.name, `{{'$value ?? ${attribute.value}'}}`, attribute.ownerElement));
                }
            }

            if (each) return Promise.all(tasks);

            let child = node.firstChild;
            if (child) {
                do {
                    tasks.push(this.add(child, container, context, rewrites));
                    // this.add(child, container, context, rewrites);
                } while (child = child.nextSibling);
            }

        }

        return Promise.all(tasks);
    }

};
