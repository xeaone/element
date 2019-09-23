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
import Show from './binder/show.js';
import Style from './binder/style.js';
import Text from './binder/text.js';
import Value from './binder/value.js';
import Write from './binder/write.js';

const DATA = new Map();

const BINDERS = {
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
    show: Show,
    showed: Show,
    style: Style,
    text: Text,
    value: Value,
    write: Write
};

export default {

    get data() { return DATA; },
    get binders() { return BINDERS; },

    async setup(options) {
        options = options || {};

        this.data.set('location', new Map());
        this.data.set('attribute', new Map());

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

    get(type) {

        if (!type) throw new Error('Oxe.binder.get - type argument required');

        let result = this.data.get(type);

        if (!result) return result;

        for (let i = 1, l = arguments.length; i < l; i++) {
            const argument = arguments[i];
            result = result.get(argument);

            if (!result) {
                return result;
            }

        }

        return result;
    },

    create(data) {

        if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
        if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
        if (data.target === undefined) throw new Error('Oxe.binder.create - missing target');
        if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');

        // if (data.value.slice(0, 2) === '{{' && data.value.slice(-2) === '}}') {
        //     data.value = data.value.slice(2, -2);
        // }

        // if (data.value.indexOf('$') !== -1 && data.context && data.context.variable && data.context.path && data.context.key) {
        //     const pattern = new RegExp(`\\$${data.context.variable}(,|\\s+|\\.|\\|)?(.*)?$`, 'ig');
        //     data.value = data.value.replace(pattern, `${data.context.path}.${data.context.key}$1$2`);
        // }

        const scope = data.container.scope;
        const names = data.names || Utility.binderNames(data.name);
        const pipes = data.pipes || Utility.binderPipes(data.value);
        const values = data.values || Utility.binderValues(data.value);

        const type = names[0];
        const path = values.join('.');
        const keys = [scope].concat(values);
        const location = keys.join('.');

        const meta = data.meta || {};
        const context = data.context || {};
        const source = type === 'on' || type === 'submit' ? data.container.methods : data.container.model;

        return {
            get location() { return location; },

            get type() { return type; },
            get path() { return path; },
            get scope() { return scope; },

            get name() { return data.name; },
            get value() { return data.value; },
            get target() { return data.target; },
            get container() { return data.container; },
            get model() { return data.container.model; },
            get methods() { return data.container.methods; },

            get keys() { return keys; },
            get names() { return names; },
            get pipes() { return pipes; },
            get values() { return values; },

            get meta() { return meta; },
            get context() { return context; },

            get data() {
                if (data.name === 'o-value') {
                    return Utility.getByPath(source, values);
                } else {
                    return Piper(this, Utility.getByPath(source, values));
                }
            },

            set data(value) {
                if (data.name === 'o-value') {
                    return Utility.setByPath(source, values, Piper(this, value));
                } else {
                    return Utility.setByPath(source, values, value);
                }
            }

        };
    },

    render(binder, caller) {

        if (binder.type === 'submit') return;

        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, caller);

        Batcher.batch(render);
    },

    unbind(node) {

        this.data.get('location').forEach(function (scopes) {
            scopes.forEach(function (binders) {
                binders.forEach(function (binder, index) {
                    if (binder.target === node) {
                        binders.splice(index, 1);
                    }
                });
            });
        });

        this.data.get('attribute').delete(node);
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

        if (!this.data.get('attribute').has(binder.target)) {
            this.data.get('attribute').set(binder.target, new Map());
        }

        if (!this.data.get('location').has(binder.scope)) {
            this.data.get('location').set(binder.scope, new Map());
        }

        if (!this.data.get('location').get(binder.scope).has(binder.path)) {
            this.data.get('location').get(binder.scope).set(binder.path, []);
        }

        this.data.get('attribute').get(binder.target).set(binder.name, binder);
        this.data.get('location').get(binder.scope).get(binder.path).push(binder);

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

                // idea
                // if (
                //     attribute.name.indexOf('{{') === 0 &&
                //     attribute.name.indexOf('}}') === attribute.name.length-2
                // ) {
                // }

                // invisble char idea
                // if (attribute.value.indexOf('{{') !== -1 && attribute.value.indexOf('}}') !== -1) {

                //     var f = false;
                //     var start = attribute.textContent.indexOf('{{');
        
                //     if (start !== -1 && start !== 0) {
                //       f = true;
                //       attribute.value = attribute.value.slice(0, start) + '\u200C' + attribute.value.slice(start);
                //     }
        
                //     var end = attribute.textContent.indexOf('}}');
                //     var length = attribute.textContent.length;
        
                //     if (f) {
                //       attribute.value = attribute.value.slice(0, end+2) + '\u200C' + attribute.value.slice(end+2);
                //     }

                // }

                if (
                    attribute.name === 'o-html' ||
                    attribute.name === 'o-scope' ||
                    attribute.name.indexOf('o-each') === 0
                ) {
                    skipChildren = true;
                }

                if (
                    attribute.name === 'o-value' ||
                    attribute.name === 'o-scope' ||
                    attribute.name === 'o-reset' ||
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

};
