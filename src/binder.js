import Traverse from './utility/traverse.js';
import Walker from './utility/walker.js';

import Batcher from './batcher.js';
import Piper from './piper.js';

import Class from './binder/class.js';
import Default from './binder/default.js';
import Disable from './binder/disable.js';
import Each from './binder/each.js';
import Enable from './binder/enable.js';
import Hide from './binder/hide.js';
import Href from './binder/href.js';
import Html from './binder/html.js';
import Label from './binder/label.js';
import On from './binder/on.js';
import Read from './binder/read.js';
import Require from './binder/require.js';
import Reset from './binder/reset.js';
import Show from './binder/show.js';
import Style from './binder/style.js';
import Submit from './binder/submit.js';
import Text from './binder/text.js';
import Value from './binder/value.js';
import Write from './binder/write.js';

const PIPE = /\s?\|\s?/;
const PIPES = /\s?,\s?|\s+/;
const PATH = /\s?,\s?|\s?\|\s?|\s+/;

export default Object.freeze({

    data: new Map(),
    nodes: new Map(),

    binders: {
        class: Class,
        css: Style,
        default: Default,
        disable: Disable,
        disabled: Disable,
        each: Each,
        enable: Enable,
        enabled: Enable,
        hide: Hide,
        hidden: Hide,
        href: Href,
        html: Html,
        label: Label,
        on: On,
        read: Read,
        require: Require,
        required: Require,
        reset: Reset,
        show: Show,
        showed: Show,
        style: Style,
        submit: Submit,
        text: Text,
        value: Value,
        write: Write
    },

    async setup(options) {
        options = options || {};

        for (const name in this.binders) {
            this.binders[name] = this.binders[name].bind(this);
        }

        if (options.binders) {

            for (const name in options.binders) {

                if (name in this.binders === false) {
                    this.binders[name] = options.binders[name].bind(this);
                }

            }

        }

    },

    get (node, name) {
        if (!(name in node.attributes)) return null;

        const value = node.attributes[name].value;
        const binders = this.nodes.get(node);

        if (!binders || !binders.length) return null;

        const length = binders.length;

        for (let i = 0; i < length; i++) {
            const binder = binders[i];
            if (binder.name === name && binder.value === value) {
                return binder;
            }
        }

        return null;
    },

    create(data) {
        const { name, names, value, values, paths, pipes, target, scope, container, context } = data;

        // if (name === undefined) throw new Error('Oxe.binder.create - missing name');
        // if (value === undefined) throw new Error('Oxe.binder.create - missing value');
        // if (target === undefined) throw new Error('Oxe.binder.create - missing target');
        // if (container === undefined) throw new Error('Oxe.binder.create - missing container');

        const meta = {};
        const type = names[0];
        const path = paths[0];
        const parts = paths[0].split('.');
        const location = `${scope}.${path}`;
        const keys = [scope].concat(parts);
        const property = parts.slice(-1)[0];

        return Object.freeze({

            location, type, path, scope,
            name, value, target, container,
            keys, names, pipes, values, meta, context,

            get data () {
                const model = Traverse(container.model, parts, 1);
                if (name === 'o-value' || name.indexOf('o-on') === 0) {
                    return model[property];
                } else {
                    return Piper(this, model[property]);
                }
            },

            set data (value) {
                const model = Traverse(container.model, parts, 1);
                if (name === 'o-value') {
                    model[property] = Piper(this, value);
                } else {
                    model[property] = value;
                }
            }

        });
    },

    render (binder, data) {
        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, data);
        Batcher.batch(render);
    },

    unbind (node) {
        const nodeBinders = this.nodes.get(node);
        if (nodeBinders) {
            for (let i = 0; i < nodeBinders.length; i++) {
                const nodeBinder = nodeBinders[i];
                nodeBinders.splice(i, i+1);
                const locationBinders = this.data.get(nodeBinder.location);
                for (let i = 0; i < locationBinders.length; i++) {
                    const locationBinder = locationBinders[i];
                    if (locationBinder === nodeBinder) {
                        locationBinders.splice(i, i+1);
                    }
                }
            }
        }
    },

    bind (node, name, value, context) {

        value = value.replace(/{{|}}/g, '');
        name = name.replace(/^o-/, '');

        const pipe = value.split(PIPE);
        const paths = value.split(PATH);

        const names = name.split('-');
        const values = pipe[0] ? pipe[0].split('.') : [];
        const pipes = pipe[1] ? pipe[1].split(PIPES) : [];

        if (context && 'variable' in context) {
            for (let i = 0, l = paths.length; i < l; i++) {
                const path = paths[i];
                const parts = path.split('.');
                const part = parts.slice(1).join('.');

                let c = context;
                while (c) {

                    if (node.nodeType === Node.TEXT_NODE) {
                        if (value === c.keyVariable) return Batcher.batch({ write() { node.textContent = c.key; } });
                        if (value === c.indexVariable) return Batcher.batch({ write() { node.textContent = c.index; } });
                    }

                    if (c.variable === parts[0]) {
                        paths[i] = `${c.path}.${c.key}${part ? `.${part}` : ''}`;
                        break;
                    }

                    if (c.indexVariable === path) {
                        paths[i] = c.index;
                        break;
                    }

                    if (c.keyVariable === path) {
                        paths[i] = c.key;
                        break;
                    }

                    const keyPattern = new RegExp(`\\[${c.keyVariable}\\]`, 'g');
                    const indexPattern = new RegExp(`\\[${c.indexVariable}\\]`, 'g');

                    paths[i] = path.replace(keyPattern, `.${c.key}`);
                    paths[i] = path.replace(indexPattern, `.${c.index}`);

                    c = c.parent;
                }

            }
        }

        const binder = this.create({
            name, names, value, values, paths, pipes,
            target: node,
            context: context,
            container: context.container,
            scope: context.container.scope
        });

        if (this.nodes.has(binder.target)) {
            this.nodes.get(binder.target).push(binder);
        } else {
            this.nodes.set(binder.target, [binder]);
        }

        if (this.data.has(binder.location)) {
            this.data.get(binder.location).push(binder);
        } else {
            this.data.set(binder.location, [binder]);
        }

        this.render(binder);
    },


    remove (node) {
        Walker(node, this.unbind.bind(this));
        // this.unbind(node);
    	// node = node.firstChild;
        //
    	// while (node) {
    	//     this.remove(node);
    	//     node = node.nextSibling;
    	// }
    },

    add (node, context) {
        if (node.nodeType === Node.TEXT_NODE) {

            const start = node.textContent.indexOf('{{');
            const end = node.textContent.indexOf('}}');

            if (start === -1 || end === -1) {
                return;
            }

            if (start !== -1 && start !== 0) {
                node = node.splitText(start);
            }

            const length = node.textContent.length;

            if (end !== -1 && end !== length-2) {
                const split = node.splitText(end + 2);
                this.bind(node, 'o-text', node.textContent, context);
                this.add(split, context);
            } else {
                this.bind(node, 'o-text', node.textContent, context);
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            let skip = false;

            const attributes = node.attributes;
            for (let i = 0, l = attributes.length; i < l; i++) {
                const attribute = attributes[i];

                // if (attribute.name === 'o-value') {
                //     continue;
                // }

                if (attribute.name.indexOf('o-each') === 0) {
                    skip = true;
                }

                if (attribute.name.indexOf('o-') === 0) {
                    this.bind(node, attribute.name, attribute.value, context);
                }

            }

            // priorities o-each
            // if ('o-value' in attributes) {
            //     this.bind(node, 'o-value', attributes['o-value'].value, context);
            // }

            if (skip) {
                return;
            }

        	node = node.firstChild;

        	while (node) {
        	    this.add(node, context);
        	    node = node.nextSibling;
        	}

        }
    }

});
