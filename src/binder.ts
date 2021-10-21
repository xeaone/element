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
        console.log('unbind', node);

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

    async bind (node: Node, container: any, name, value, owner, context: any, rewrites?: any) {

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const handler = this.binders[ type ];

        const binder = {
            meta: {},
            ready: true,
            binder: this,
            paths: undefined,
            render: undefined,
            compute: undefined,
            unrender: undefined,
            binders: this.pathBinders,
            node, owner, name, value, rewrites, context, container, type,
        };

        const [ paths, compute ] = await Promise.all([
            parser(value, rewrites),
            computer(binder)
        ]);

        binder.paths = paths;
        binder.compute = compute;
        binder.render = handler.render.bind(null, binder);
        binder.unrender = handler.unrender.bind(null, binder);

        if (value === '{{version.id}}') {
            console.log(owner, owner.parentNode, binder);
        }

        for (const reference of paths) {
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

        // if (node.nodeType === AN) {
        //     const attribute = (node as Attr);
        //     if (this.syntaxMatch.test(attribute.value)) {
        //         tasks.push(this.bind(node, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
        //     }
        // } else
        if (node.nodeType === TN) {
            const tasks = [];

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                tasks.push(this.add(split, container, context, rewrites));
            }

            tasks.push(this.bind(node, container, 'text', node.nodeValue, node, context, rewrites));

            return Promise.all(tasks);
        } else if (node.nodeType === EN) {
            const component = node.nodeName.includes('-');
            const attributes = (node as Element).attributes;

            if (component) {
                // await window.customElements.whenDefined((node as any).localName);
                // await (node as any).whenReady();
                if (!(node as any).ready) {
                    await new Promise((resolve: any) => node.addEventListener('ready', resolve));
                }
            }

            const each = attributes[ 'each' ];
            if (each) await this.bind(each, container, each.name, each.value, each.ownerElement, context, rewrites);

            if (!each && !component) {
                const children = [];

                let child = node.firstChild;
                if (child) {
                    do {
                        children.push(this.add(child, container, context, rewrites));
                    } while (child = child.nextSibling);
                }

                await Promise.all(children);
            }

            const inherit = attributes[ 'inherit' ];
            if (inherit) await this.bind(inherit, container, inherit.name, inherit.value, inherit.ownerElement, context, rewrites);

            const tasks = [];
            for (const attribute of attributes) {
                if (attribute.name !== 'each' && attribute.name !== 'inherit' && this.syntaxMatch.test(attribute.value)) {
                    tasks.push(this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                }
            }
            return Promise.all(tasks);

        }

    }

};
