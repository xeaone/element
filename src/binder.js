import Traverse from './utility/traverse.js';
// import Walker from './utility/walker.js';

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

    // get ds () { return '['; },
    // get de () { return ']'; },
    prefix: 'o-',
    syntaxEnd: '}}',
    syntaxStart: '{{',
    prefixReplace: new RegExp('^o-'),
    syntaxReplace: new RegExp('{{|}}', 'g'),

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

    async setup (options) {
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
        // if (name in node.attributes === false) return null;

        const value = node.attributes[name].value;
        const binders = this.nodes.get(node);

        if (!binders) return null;

        for (let i = 0, l = binders.length; i < l; i++) {
            const binder = binders[i];
            if (binder.name === name && binder.value === value) {
                return binder;
            }
        }

        return null;
    },

    render (binder, data, e) {
        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, data, e);
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

    bind (target, name, value, container, scope) {

        value = value.replace(this.syntaxReplace, '').trim();
        name = name.replace(this.prefixReplace, '').replace(this.syntaxReplace, '').trim();

        const pipe = value.split(PIPE);
        const paths = value.split(PATH);

        const names = name.split('-');
        const values = pipe[0] ? pipe[0].split('.') : [];
        const pipes = pipe[1] ? pipe[1].split(PIPES) : [];

        const meta = {};
        const type = names[0];
        const path = paths[0];
        const parts = paths[0].split('.');
        const location = `${scope}.${path}`;
        const keys = [ scope ].concat(parts);
        const property = parts.slice(-1)[0];

        const binder = Object.freeze({

            location, type, path, scope,
            name, value, target, container,
            keys, names, pipes, values, meta,

            get data () {
            // if (names[0] === 'on') {
            //     const source = Traverse(container.methods, parts, 1);
            //     return source[property];
            // } else {
                const source = Traverse(container.model, parts, 1);
                if (names[0] === 'value') {
                    return source[property];
                } else {
                    return Piper(this, source[property]);
                }
            // }
            },

            set data (value) {
            // if (names[0] === 'on') {
            //     const source = Traverse(container.methods, parts, 1);
            //     source[property] = value;
            // } else {
                const source = Traverse(container.model, parts, 1);
                if (names[0] === 'value') {
                    source[property] = Piper(this, value);
                } else {
                    source[property] = value;
                }
            // }
            }

        });

        if (this.nodes.has(binder.target)) {
            this.nodes.get(binder.target).push(binder);
        } else {
            this.nodes.set(binder.target, [ binder ]);
        }

        if (this.data.has(binder.location)) {
            this.data.get(binder.location).push(binder);
        } else {
            this.data.set(binder.location, [ binder ]);
        }

        this.render(binder);
    },

    remove (node) {
        // Walker(node, this.unbind.bind(this));
        this.unbind(node);
        node = node.firstChild;

        while (node) {
            this.remove(node);
            node = node.nextSibling;
        }
    },

    add (node, container, scope) {
        if (node.nodeType === Node.TEXT_NODE) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1)  return;

            if (start !== 0) node = node.splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end+this.syntaxStart.length !== node.textContent.length) {
                const split = node.splitText(end + this.syntaxEnd.length);
                this.bind(node, `${this.prefix}text`, node.textContent, container, scope);
                this.add(split);
            } else {
                this.bind(node, `${this.prefix}text`, node.textContent,  container, scope);
            }

        } else if (node.nodeType === Node.ELEMENT_NODE) {
            let skip = false;

            const attributes = node.attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];

                // if (attribute.name === 'o-value') continue;

                if (attribute.name.indexOf(`${this.prefix}each`) === 0) {
                    skip = true;
                }

                if (attribute.name.indexOf(this.prefix) === 0) {
                    this.bind(node, attribute.name, attribute.value, container, scope);
                }

            }

            // priorities o-each
            // if ('o-value' in attributes) {
            //     this.bind(node, 'o-value', attributes['o-value'].value);
            // }

            if (skip) return;

            // Walker(node, this.add.bind(this, node);

            node = node.firstChild;
            while (node) {
                this.add(node, container, scope);
                node = node.nextSibling;
            }

        }
    }

});
