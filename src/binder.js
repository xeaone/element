import Utility from './utility.js';
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

    get(node, name) {
        const value = node.attributes[name].value;
        const binders = this.nodes.get(node);
        for (let i = 0, l = binders.length; i < l; i++) {
            const binder = binders[i];
            if (binder.name === name && binder.value === value) {
                return binder;
            }
        }
        return null;
    },

    // get(node, name, scope) {
    //     const value = node.attributes[name].value;
    //     const location = `${scope}.${value.replace(/\s?\|\s?.*$/, '')}`;
    //     const binders = this.data.get(location);
    //     for (let i = 0, l = binders.length; i < l; i++) {
    //         const binder = binders[i];
    //         if (binder.name === name && binder.value === value) {
    //             return binder;
    //         }
    //     }
    //     return null;
    // },

    create(data) {
        const { name, value, target, container } = data;

        if (name === undefined) throw new Error('Oxe.binder.create - missing name');
        if (value === undefined) throw new Error('Oxe.binder.create - missing value');
        if (target === undefined) throw new Error('Oxe.binder.create - missing target');
        if (container === undefined) throw new Error('Oxe.binder.create - missing container');

        const scope = container.scope;
        const names = data.names || Utility.binderNames(name);
        const pipes = data.pipes || Utility.binderPipes(value);
        const values = data.values || Utility.binderValues(value);

        const type = names[0];
        const path = values.join('.');
        const keys = [scope].concat(values);
        const location = keys.join('.');

        const meta = data.meta || {};
        const context = data.context || {};

        // get pipes here also

        const property = values[values.length-1];
        let model = container.model;
        for (let i = 0, l = values.length-1; i < l ; i++) {
            model = model[values[i]];
        }

        return Object.freeze({

            location, type, path, scope,
            name, value, target, container,
            keys, names, pipes, values, meta, context,

            get data() {
                if (name === 'o-value' || name.indexOf('o-on') === 0) {
                    return model[property];
                } else {
                    return Piper(this, model[property]);
                }
            },

            set data(value) {
                if (name === 'o-value') {
                    return model[property] = Piper(this, value);
                } else {
                    return model[property] = value;
                }
            }

        });
    },

    render(binder, caller) {
        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, caller);
        Batcher.batch(render);
    },

    unbind(node) {
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

    bind(node, name, value, context) {

        if (context) {

            // NOTE: might be able to stop the loop after a match is found
            let c = context;
            while (c) {

                if (node.nodeType === Node.TEXT_NODE) {

                    if (value === `{{${c.keyVariable}}}`) {
                        return Batcher.batch({ write() { node.textContent = c.key; } });
                    }

                    if (value === `{{${c.indexVariable}}}`) {
                        return Batcher.batch({ write() { node.textContent = c.index; } });
                    }

                }

                if (c.keyVariable) {
                    const pattern = new RegExp(`(^|[^A-Za-z0-9_$.])${c.keyVariable}([^A-Za-z0-9_$.]|$)`, 'g');
                    value = value.replace(pattern, `$1${c.key}$2`);
                }

                if (c.indexVariable) {
                    const pattern = new RegExp(`(^|[^A-Za-z0-9_$.])${c.indexVariable}([^A-Za-z0-9_$.]|$)`, 'g');
                    value = value.replace(pattern, `$1${c.index}$2`);
                }

                if (c.variable) {
                    const pattern = new RegExp(`(^|[^A-Za-z0-9_$.])${c.variable}([^A-Za-z0-9_$]|$)`, 'g');
                    value = value.replace(pattern, `$1${c.path}.${c.key}$2`);
                }

                c = c.parentContext;
            }

        }

        if (value && value.slice(0, 2) === '{{' && value.slice(-2) === '}}') {
            value = value.slice(2, -2);
        }

        const binder = this.create({
            name: name,
            value: value,
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


    remove(node) {

        this.unbind(node);

        for (let i = 0; i < node.childNodes.length; i++) {
            this.remove(node.childNodes[i]);
        }

    },

    add(node, context) {
        if (node.nodeType === Node.TEXT_NODE) {

            if (node.textContent.indexOf('{{') === -1 || node.textContent.indexOf('}}') === -1) {
                return;
            }

            const start = node.textContent.indexOf('{{');
            if (start !== -1 && start !== 0) {
                node = node.splitText(start);
            }

            const end = node.textContent.indexOf('}}');
            const length = node.textContent.length;
            if (end !== -1 && end !== length-2) {
                const split = node.splitText(end + 2);
                this.bind(node, 'o-text', node.textContent, context);
                this.add(split, context);
            } else {
                this.bind(node, 'o-text', node.textContent, context);
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            let skipChildren = false;

            const attributes = node.attributes;
            for (let i = 0, l = attributes.length; i < l; i++) {
                const attribute = attributes[i];

                if (
                    attribute.name === 'o-html' ||
                    // attribute.name === 'o-scope' ||
                    attribute.name.indexOf('o-each') === 0
                ) {
                    skipChildren = true;
                }

                if (
                    attribute.name === 'o-value' ||
                    // attribute.name === 'o-scope' ||
                    attribute.name === 'o-action' ||
                    attribute.name === 'o-method' ||
                    attribute.name === 'o-enctype' ||
                    attribute.name.indexOf('o-') !== 0
                ) {
                    continue;
                }

                this.bind(node, attribute.name, attribute.value, context);
            }

            // priorities o-each
            if ('o-value' in attributes) {
                this.bind(node, 'o-value', attributes['o-value'].value, context);
            }

            if (skipChildren) return;

            for (let i = 0; i < node.childNodes.length; i++) {
                this.add(node.childNodes[i], context);
            }

        } else if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.add(node.childNodes[i], context);
            }
        }
    }

});
