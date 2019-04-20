import Piper from './piper.js';
import Binder from './binder.js';
import Utility from './utility.js';
import Batcher from './batcher.js';

const DATA = new Map();

export default {

    get data () { return DATA; },

    target: document.body,
    emptyPattern: /^\s+$/,

    async setup (options) {
        options = options || {};

        this.data.set('context', new Map());
        this.data.set('target', new Map());
        this.data.set('location', new Map());
        this.data.set('attribute', new Map());

        this.target = options.target || document.body;

        const observer = new MutationObserver(this.listener.bind(this));

        observer.observe(this.target, {
            subtree: true,
            childList: true
        });

    },

    get (type) {
        let result = this.data.get(type);

        for (let i = 1, l = arguments.length; i < l; i++) {
            const argument = arguments[i];
            result = result.get(argument);
        }

        return result;
    },

    remove (node) {
        const binders = this.data.get('target').get(node);

        if (!binders) return;

        for (let i = 0, l = binders.length; i < l; i++) {
            const binder = binders[i];
            const locations = this.data.get('location').get(binder.location);

            if (!locations) continue;

            const index = locations.indexOf(binder);

            if (index !== -1) {
                locations.splice(index, 1);
            }

            if (locations.length === 0) {
                this.data.get('location').delete(binder.location);
            }

        }

        this.data.get('target').delete(node);
        this.data.get('attribute').delete(node);
    },

    add (binder) {

        if (this.data.get('location').has(binder.location)) {
            this.data.get('location').get(binder.location).push(binder);
        } else {
            this.data.get('location').set(binder.location, [ binder ]);
        }

        if (this.data.get('target').has(binder.target)) {
            this.data.get('target').get(binder.target).push(binder);
        } else {
            this.data.get('target').set(binder.target, [ binder ]);
        }

        if (!this.data.get('attribute').has(binder.target)) {
            this.data.get('attribute').set(binder.target, new Map());
        }

        this.data.get('attribute').get(binder.target).set(binder.name, binder);
    },

    bind (node, attribute, container) {

        const binder = Binder.create({
            target: node,
            container: container,
            name: attribute.name,
            value: attribute.value,
            scope: container.scope
        });

        this.add(binder);

        let data;

        if (binder.type === 'on') {
            data = Utility.getByPath(container.methods, binder.values);
        } else {
            data = Utility.getByPath(container.model, binder.values);
            data = Piper(binder, data);
        }

        Binder.render(binder, data);
    },

    removeContext (node) {

        this.get('context').delete(node);

        for (let i = 0; i < node.childNodes.length; i++) {
            this.removeContext(node.childNodes[i]);
        }

    },

    addContext (node, context) {
        if (node.nodeType === Node.TEXT_NODE) {

		 	if (node.textContent.indexOf('{{') === -1) return;

            this.data.get('context').set(node, context);

            const start = node.textContent.indexOf('{{');
            if (start !== -1 && start !== 0) {
                node = node.splitText(start);
            }

            const end = node.textContent.indexOf('}}');
            const length = node.textContent.length;
            if (end !== -1 && end !== length-2) {
                const split = node.splitText(end+2);
                this.addContext(node, context);
                this.addContext(split, context);
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {

            // filter out non o- nodes

            this.data.get('context').set(node, context);

            if (
            // this.hasAttribute(node, 'o-scope') ||
                this.hasAttribute(node, 'o-each') ||
				this.hasAttribute(node, 'o-html')
            ) {
                return;
            }

            for (let i = 0; i < node.childNodes.length; i++) {
                this.addContext(node.childNodes[i], context);
            }

        }
    },

    addNodes (nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const context = this.data.get('context').get(node);

            if (!context) continue;

            if (node.nodeType === Node.TEXT_NODE) {

                // if (this.emptyPattern.test(text)) continue;
                // const context = this.data.get('context').get(node);
                // if (!context) continue;

                let text = node.textContent;
                if (text.indexOf('{{') !== 0 && text.indexOf('}}') !== text.length-2) continue;

                if (
                    text === `{{$${context.variable}.$key}}` ||
					text === `{{$${context.variable}.$index}}`
                ) {
                    Batcher.batch({
                        context: {
                            node: node,
                            key: context.key,
                            variable: context.variable
                        },
                        read () { this.text = this.node.textContent; },
                        write () { this.node.textContent = this.key; }
                    });
                } else {
                    if (context.variable && context.path && context.key) {
                        const pattern = new RegExp(`{{\\$${context.variable}(,|\\s+|\\.|\\|)?(.*)?}}`, 'ig');
                        text = text.replace(pattern, `${context.path}.${context.key}$1$2`);
                    } else {
                        text = text.slice(2, -2);
                    }

                    const value = Utility.binderValues(text).join('.');
                    this.bind(node, { name: 'o-text', value: value }, context.container);
                }

            }

            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            // const context = this.data.get('context').get(node);
            // if (!context) continue;

            const attributes = node.attributes;
            for (let i = 0, l = attributes.length; i < l; i++) {
                const attribute = attributes[i];

                if (
                    attribute.name.indexOf('o-') !== 0 ||
					attribute.name === 'o-scope' ||
					attribute.name === 'o-reset' ||
					attribute.name === 'o-action' ||
					attribute.name === 'o-method' ||
					attribute.name === 'o-enctype'
                ) {
                    continue;
                }

                if (attribute.value.indexOf('$') !== -1) {
                    // attribute.value = attribute.value.replace(, `${context.key}`);
                    const pattern = new RegExp(`\\$${context.variable}(,|\\s+|\\.|\\|)?(.*)?$`, 'ig');
                    attribute.value = attribute.value.replace(pattern, `${context.path}.${context.key}$1$2`);
                }

                this.bind(node, attribute, context.container);
            }

            this.addNodes(node.childNodes);
        }
    },

    removeNodes (nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            this.remove(node);
            this.data.get('context').delete(node);
            this.removeNodes(node.childNodes);
        }
    },

    hasAttribute (node, name) {
        const attributes = node.attributes;
        for (let i = 0, l = attributes.length; i < l; i++) {
            const attribute = attributes[i];
            if (attribute.name.indexOf(name) === 0) {
                return true;
            }
        }
        return false;
    },

    listener (records) {
        for (let i = 0, l = records.length; i < l; i++) {
            const record = records[i];

            this.addNodes(record.addedNodes);

            if (record.target.nodeName !== 'O-ROUTER') {
                this.removeNodes(record.removedNodes);
            }

        }
    }

};
