import Traverse from './tool/traverse.js';

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

const Binder = {

    data: new Map(),

    prefix: 'o-',
    syntaxEnd: '}}',
    syntaxStart: '{{',
    prefixReplace: new RegExp('^o-'),
    syntaxReplace: new RegExp('{{|}}', 'g'),

    binders: {
        class: Class.bind(Binder),
        css: Style.bind(Binder),
        default: Default.bind(Binder),
        disable: Disable.bind(Binder),
        disabled: Disable.bind(Binder),
        each: Each.bind(Binder),
        enable: Enable.bind(Binder),
        enabled: Enable.bind(Binder),
        hide: Hide.bind(Binder),
        hidden: Hide.bind(Binder),
        href: Href.bind(Binder),
        html: Html.bind(Binder),
        label: Label.bind(Binder),
        on: On.bind(Binder),
        read: Read.bind(Binder),
        require: Require.bind(Binder),
        required: Require.bind(Binder),
        reset: Reset.bind(Binder),
        show: Show.bind(Binder),
        showed: Show.bind(Binder),
        style: Style.bind(Binder),
        submit: Submit.bind(Binder),
        text: Text.bind(Binder),
        value: Value.bind(Binder),
        write: Write.bind(Binder)
    },

    async setup (options = {}) {
        const { binders } = options;

        if (binders) {
            for (const name in binders) {
                if (name in this.binders === false) {
                    this.binders[name] = binders[name].bind(this);
                }
            }
        }

    },

    get (node) {
        return this.data.get(node);
    },

    render (binder) {
        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](...arguments);
        Batcher.batch(render);
    },

    unbind (node) {
        return this.data.remove(node);
    },

    bind (target, name, value, container, scope, attr) {

        value = value.replace(this.syntaxReplace, '').trim();
        name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();

        if (name.indexOf('on') === 0) {
            name = 'on-' + name.slice(2);
        }

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

        this.data.set(attr || binder.target, binder);

        if (target.nodeName.includes('-')) {
            window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
        } else {
            this.render(binder);
        }

    },

    remove (node) {

        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            this.unbind(attribute);
        }

        this.unbind(node);
        node = node.firstChild;

        while (node) {
            this.remove(node);
            node = node.nextSibling;
        }
    },

    add (node, container, scope) {
        const type = node.nodeType;
        // if (node.nodeType === Node.ATTRIBUTE_NODE) {
        //     if (node.name.indexOf(this.prefix) === 0) {
        //         this.bind(node, node.name, node.value, container, scope, attribute);
        //     }
        // } else
        if (type === Node.TEXT_NODE) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1)  return;

            if (start !== 0) node = node.splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end+this.syntaxStart.length !== node.textContent.length) {
                const split = node.splitText(end + this.syntaxEnd.length);
                this.bind(node, 'text', node.textContent, container, scope);
                this.add(split);
            } else {
                this.bind(node, 'text', node.textContent,  container, scope);
            }

        } else if (type === Node.ELEMENT_NODE) {
            let skip = false;

            const attributes = node.attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                const { name, value } = attribute;

                if (
                    name.indexOf(this.prefix) === 0
                    ||
                    (name.indexOf(this.syntaxStart) !== -1 && name.indexOf(this.syntaxEnd) !== -1)
                    ||
                    (value.indexOf(this.syntaxStart) !== -1 && value.indexOf(this.syntaxEnd) !== -1)
                ) {

                    if (
                        name.indexOf('each') === 0
                        ||
                        name.indexOf(`${this.prefix}each`) === 0
                    ) {
                        skip = true;
                    }

                    this.bind(node, name, value, container, scope, attribute);
                }

            }

            if (skip) return;

            node = node.firstChild;
            while (node) {
                this.add(node, container, scope);
                node = node.nextSibling;
            }

        }
    }

};

export default Object.freeze(Binder);
