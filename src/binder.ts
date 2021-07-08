import Statement from './statement';

import standard from './binder/standard';
import checked from './binder/checked';
import value from './binder/value';
import each from './binder/each';
import html from './binder/html';
import text from './binder/text';
import on from './binder/on';

// type NODE = Element | Text | Attr;

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

    async bind (node: Node, container: any, name, value, owner, dynamics?: any) {
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
            // binder.render();
        }

    };

    async remove (node: Node) {
        const type = node.nodeType;

        if (type === AN || type === TN) {
            tick.then(this.unbind.bind(this, node));
        } else if (type === EN) {
            const attributes = (node as Element).attributes;
            const l = attributes.length;
            for (let i = 0; i < l; i++) {
                tick.then(this.unbind.bind(this, attributes[ i ]));
            }

            let child = node.firstChild;
            while (child) {
                tick.then(this.remove.bind(this, child));
                child = child.nextSibling;
            }

        }

    }

    async add (node: Node, container: any, dynamics?: object) {

        if (node.nodeType === AN) {
            if (this.syntaxMatch.test((node as Attr).value)) {
                tick.then(this.bind.bind(this, node, container, (node as Attr).name, (node as Attr).value, (node as Attr).ownerElement, dynamics));
                // this.bind(node, container, (node as Attr).name, (node as Attr).value, (node as Attr).ownerElement, dynamics);
            }
        } else if (node.nodeType === TN) {

            const start = node.nodeValue.indexOf(this.syntaxStart);
            if (start === -1) return;

            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.nodeValue.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxLength !== node.nodeValue.length) {
                const split = (node as Text).splitText(end + this.syntaxLength);
                tick.then(this.add.bind(this, split, container, dynamics));
                // this.add(split, container, dynamics, handler);
            }

            // this.bind(node, container, 'text', node.nodeValue, node, dynamics);
            tick.then(this.bind.bind(this, node, container, 'text', node.nodeValue, node, dynamics));
        } else if (node.nodeType === EN) {
            let each = false;

            for (let i = 0; i < (node as Element).attributes.length; i++) {
                const attribute = (node as Element).attributes[ i ];
                if (attribute.name === 'each' || attribute.name === `${this.prefix}each`) each = true;
                if (this.syntaxMatch.test(attribute.value)) {
                    tick.then(this.bind.bind(this, attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics));
                    // this.bind(attribute, container, attribute.name, attribute.value, attribute.ownerElement, dynamics);
                }
            }

            if (each) return;

            let child = node.firstChild;
            while (child) {
                tick.then(this.add.bind(this, child, container, dynamics));
                // this.add(child, container, dynamics);
                child = child.nextSibling;
            }

        }

    }

};
