import standard from './binder/standard';
import checked from './binder/checked';
import inherit from './binder/inherit';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';
import computer from './computer';

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

    nodeBinders: Map<Node, Set<any>> = new Map();
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
            meta: {},
            paths: [],
            ready: true,
            binder: this,
            render: undefined,
            compute: undefined,
            binders: this.pathBinders,
            node, owner, name, value, rewrites, context, container,
            type: name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard',
        };

        (node as any).$binder = binder;
        binder.compute = computer(binder);

        binder.render = async function () {
            if (!this.ready) {
                return this.cancel = async () => {
                    this.cancel = null;
                    this.ready = false;
                    this.task = await this.binder.binders[ this.type ](this);
                    this.ready = true;
                    return this.task;
                };
            }
            this.ready = false;
            this.task = await this.binder.binders[ this.type ](this);
            this.ready = true;
            return this.task;
        };

        if (node.nodeType === AN) {
            owner.$binders = owner.$binders || new Map();
            owner.$binders.set(name, binder);
        }

        return binder.render();
    };

    async remove (node: Node) {
        const tasks = [];

        if (node.nodeType === AN || node.nodeType === TN) {
            tasks.push(this.unbind(node));
        } else if (node.nodeType === EN) {
            const attributes = (node as Element).attributes;
            for (const attribute of attributes) {
                tasks.push(this.unbind(attribute));
            }

            let child = node.firstChild;
            while (child) {
                tasks.push(this.remove(child));
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

            // let each = (node as Element).attributes[ 'each' ];
            // if (each && this.syntaxMatch.test(each.value)) {
            //     each = this.bind(each, container, each.name, each.value, each.ownerElement, context, rewrites);
            // }

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
                    if (attribute.name === 'each' || attribute.name === this.prefixEach) {
                        each = this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites);
                    } else {
                        tasks.push(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, context, rewrites));
                    }
                }
            }

            if (each) return each().then(() => Promise.all(tasks.map(task => task())));

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
