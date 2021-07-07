import Statement from './statement';

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

const tick = Promise.resolve();

// const emptyAttribute = /\s*{{\s*}}\s*/;
// const emptyText = /\s+|(\\t)+|(\\r)+|(\\n)+|^$/;
// const emptyText = /\s+|(\\t)+|(\\r)+|(\\n)+|\s*{{\s*}}\s*|^$/;

interface Options {
    binders?: () => Promise<void>;
}

export default class Binder {

    prefix = 'o-';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    syntaxLength = 2;
    syntaxMatch = new RegExp('{{.*?}}');
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    nodeBinders: Map<Node, Map<string, any>> = new Map();
    pathBinders: Map<string, Map<Node, any>> = new Map();

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

        for (const [ path ] of nodeBinders) {
            this.pathBinders.get(path).delete(node);
        }

        this.nodeBinders.delete(node);
    }

    async bind (node: Node, container: any, dynamics?: any) {

        let owner, name, value;
        if (node.nodeType === AN) {
            const attribute = (node as Attr);
            owner = attribute.ownerElement;
            name = attribute.name;
            value = attribute.value;
        } else {
            owner = node;
            name = 'text';
            value = node.textContent;
        }

        const type = name.startsWith('on') ? 'on' : name in this.binders ? name : 'standard';
        const render = this.binders[ type ];

        const { compute, assignee, paths } = Statement(value, container.data, dynamics);
        if (!paths.length) paths.push('');

        const binder = {
            render,
            meta: {},
            node, owner,
            busy: false,
            container, type,
            assignee,
            name, value, paths,
            binder: this,
            dynamics,
            compute
        };

        binder.render = render.bind(render, binder);

        for (const path of paths) {

            if (path) {
                if (!this.nodeBinders.has(node)) this.nodeBinders.set(node, new Map());
                if (!this.pathBinders.has(path)) this.pathBinders.set(path, new Map());
                this.nodeBinders.get(node).set(path, binder);
                this.pathBinders.get(path).set(node, binder);
            }

            tick.then(binder.render);
        }

    };

    async remove (node: Node) {
        const type = node.nodeType;

        if (type === EN) {
            const attributes = (node as Element).attributes;
            const l = attributes.length;
            for (let i = 0; i < l; i++) {
                this.unbind(attributes[ i ]);
            }
        }

        this.unbind(node);

        let child = node.firstChild;
        while (child) {
            this.remove(child);
            child = child.nextSibling;
        }

    }

    async add (node: Node, container: any, extra?: any) {
        const type = node.nodeType;

        if (type === AN) {
            const attribute = (node as Attr);
            if (this.syntaxMatch.test(attribute.value)) {
                tick.then(this.bind.bind(this, attribute, container, extra));
            }
        } else if (type === TN) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.textContent.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                tick.then(this.add.bind(this, split, container, extra));
            }

            tick.then(this.bind.bind(this, node, container, extra));
        } else if (type === EN) {
            let each = false;

            const attributes = (node as Element).attributes;
            const l = attributes.length;
            for (let i = 0; i < l; i++) {
                const attribute = attributes[ i ];
                if (attribute.name === 'each' || attribute.name === `${this.prefix}each`) each = true;
                if (this.syntaxMatch.test(attribute.value)) {
                    tick.then(this.bind.bind(this, attribute, container, extra));
                }
            }

            if (!each) {
                let child = node.firstChild;
                while (child) {
                    tick.then(this.add.bind(this, child, container, extra));
                    child = child.nextSibling;
                }
            }

        }

    }

};
