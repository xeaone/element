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
// const AN = Node.ATTRIBUTE_NODE;

export default class Binder {

    prefix = 'o-';
    prefixEach = 'o-each';
    prefixValue = 'o-value';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    syntaxLength = 2;
    binders: Map<any, any> = new Map();
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    // nodeBinders: Map<Node, any> = new Map();
    // ownerBinders: Map<Node, Set<any>> = new Map();
    // pathBinders: Map<string, Set<any>> = new Map();

    handlers = {
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

    unbind (node: Node) {
        const ownerBinders = this.ownerBinders.get(node);
        if (!ownerBinders) return;

        for (const ownerBinder of ownerBinders) {
            this.nodeBinders.delete(ownerBinder.node);
            for (const path of ownerBinder.paths) {
                const pathBinders = this.pathBinders.get(path);
                if (!pathBinders) continue;
                pathBinders.delete(ownerBinder);
                if (!pathBinders.size) this.pathBinders.delete(path);
            }
        }

        this.nodeBinders.delete(node);
        this.ownerBinders.delete(node);
    }

    bind (node: Node, container: any, name, value, owner, context: any, rewrites?: any) {
        const type = name.startsWith('on') ? 'on' : name in this.handlers ? name : 'standard';
        const handler = this.handlers[ type ];

        const binder = {
            meta: {},
            binder: this,
            render: undefined,
            compute: undefined,
            unrender: undefined,
            references: undefined,
            rewrites: rewrites ?? [],
            node, owner, name, value, context, container, type,
        };

        const references = parser(value);
        const compute = computer(binder);

        binder.compute = compute;
        binder.references = [ ...references ];
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);

        for (let i = 0; i < binder.references.length; i++) {

            if (rewrites) {
                for (const [ name, value ] of rewrites) {
                    binder.references[ i ] = binder.references[ i ].replace(name, value);
                }
            }

            if (this.binders.has(binder.references[ i ])) {
                this.binders.get(binder.references[ i ]).add(binder);
            } else {
                this.binders.set(binder.references[ i ], new Set([ binder ]));
            }
        }

        if (this.binders.has(binder.owner)) {
            this.binders.get(binder.owner).add(binder);
        } else {
            this.binders.set(binder.owner, new Set([ binder ]));
        }

        binder.render();
    };

    remove (node: Node) {

        if (node.nodeType === TN) {
            this.unbind(node);
        } else if (node.nodeType === EN) {
            this.unbind(node);
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                this.unbind(attribute);
            }

            let child = node.firstChild;
            while (child) {
                this.remove(child);
                child = child.nextSibling;
            }

        }

    }

    add (node: Node, container: any, context: any, rewrites?: any) {

        if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                this.add(split, container, context, rewrites);
            }

            this.bind(node, container, 'text', node.nodeValue, node, context, rewrites);

        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;

            const inherit = attributes[ 'inherit' ];
            if (inherit) this.bind(inherit, container, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);

            const each = attributes[ 'each' ];
            if (each) this.bind(each, container, each.name, each.value, each.ownerElement, context, rewrites);

            if (!each && !inherit) {
                let child = node.firstChild;
                if (child) {
                    do this.add(child, container, context, rewrites);
                    while (child = child.nextSibling);
                }
            }

            if (attributes.length) {
                for (const attribute of attributes) {
                    if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.syntaxMatch.test(attribute.value)) {
                        this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    }
                }
            }

        }

    }

};
