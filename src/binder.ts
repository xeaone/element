import { traverse } from './tool';

import Batcher from './batcher';

import checked from './binder/checked';
import Class from './binder/class';
import Default from './binder/default';
import each from './binder/each';
import html from './binder/html';
import on from './binder/on';
import reset from './binder/reset';
// import submit from '../_/submit';
import text from './binder/text';
import value from './binder/value';

const PIPE = /\s?\|\s?/;
const PIPES = /\s?,\s?|\s+/;
// const PATH = /\s?,\s?|\s?\|\s?|\s+/;
// const VARIABLE_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
const PATH_PATTERNS = /[._$a-zA-Z0-9\[\]]+/g;
const PARAMETER_PATTERNS = /{{[._$a-zA-Z0-9,\(\)\[\] ]+}}/g;
const eachPattern = /^\s*[._$a-zA-Z0-9\[\]]+\s+of\s+/;

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;

export default new class Binder {

    data: Map<Node, any> = new Map();

    prefix = 'o-';
    syntaxEnd = '}}';
    syntaxStart = '{{';
    prefixReplace = new RegExp('^o-');
    syntaxReplace = new RegExp('{{|}}', 'g');

    binders = {
        checked,
        class: Class,
        each,

        default: Default,

        html,
        on,
        reset,
        // submit,
        text,
        value,
    }

    // async setup(options: any = {}) {
    //     const { binders } = options;

    //     if (binders) {
    //         for (const name in binders) {
    //             if (name in this.binders === false) {
    //                 this.binders[name] = binders[name].bind(this);
    //             }
    //         }
    //     }

    // }

    get(node) {
        return this.data.get(node);
    }

    async render(binder: any, ...extra) {

        if (binder.busy) return;
        else binder.busy = true;

        const type = binder.type in this.binders ? binder.type : 'default';
        const render = this.binders[type](binder, ...extra);

        if (render) {
            const context = {};
            Batcher.batch(async () => {
                if (render.read) await render.read(context);
            }, async () => {
                if (render.write) await render.write(context);
                binder.busy = false;
            });
        }
    }

    async unbind(node: Node) {
        return this.data.delete(node);
    }

    async bind(target: Node, name: string, value: string, container: any, pointer: Node | Attr) {
        const self = this;

        // if (value.startsWith('{{\'') || value.startsWith('{{\"')) {
        //     target.textContent = value.slice(3, -3);
        //     return;
        // } else if (/\s*{{(^NaN$|^true$|^false$|^[0-9]+$)}}\s*/.test(value)) {
        //     target.textContent = value;
        //     return;
        // }

        const parameters = value.match(PARAMETER_PATTERNS);
        if (!parameters) return console.error(`Oxe.binder.bind - value ${value} is not valid`);

        // value = value.replace(this.syntaxReplace, '').trim();
        // name = name.replace(this.syntaxReplace, '').replace(this.prefixReplace, '').trim();
        // if (name.startsWith('on')) name = 'on-' + name.slice(2);

        // const pipe = value.split(PIPE);
        // const values = value.match(PARAMETER_PATTERNS);
        const paths = parameters.map(path =>
            path
                .replace(this.syntaxReplace, '')
                .replace(eachPattern, '')
        );
        // const keys = parameters.map(key => key.replace(this.syntaxReplace, '').split('.'));
        // const names = name.split('-');

        const type = name.startsWith('on') ? 'on' : name;

        // const values = pipe[0] ? pipe[0].split('.') : [];
        // const pipes = pipe[1] ? pipe[1].split(PIPES) : [];
        // const properties = path.split('.');
        // const property = properties.slice(-1)[0];

        paths.forEach((path, index) => {

            const keys = path.split('.');
            const [key] = keys.slice(-1);

            const parameter = parameters[index];
            // const parameterPaths = paths.slice(1);
            const childKey = keys.slice(-1)[0];
            const parentKeys = keys.slice(0, -1);

            const binder = Object.freeze({

                meta: {},
                _meta: { busy: false },
                get busy() { return this._meta.busy; },
                set busy(busy) { this._meta.busy = busy; },

                key, keys,
                name, value,
                path, paths,
                parameter, parameters,
                // value, values,

                // pipes,
                // property, properties,

                type,
                target, container,

                render: self.render,

                childKey,
                parentKeys,
                // parameterPaths,

                // index,
                display(data: any) {
                    let value = this.value;
                    parameters.forEach(parameter => {
                        value = value.replace(
                            parameter, parameter === this.parameter ? data : traverse(
                                container.data,
                                parameter.replace(/{{|}}/, '').split('.')
                            )
                        );
                    });
                    return value;
                },

                getAttribute(name: string) {
                    const node = (target as any).getAttributeNode(name);
                    if (!node) return undefined;
                    const data = (self.data?.get(node) as any)?.data;
                    return data === undefined ? node.value : data;
                },

                get data() {
                    const parentValue = traverse(this.container.data, this.parentKeys);

                    const childValue = parentValue?.[this.childKey];

                    // if (this.type === 'on') {
                    if (typeof childValue === 'function') {
                        return event => {
                            // const parameters = this.parameterPaths.map(path => traverse(container.data, path));
                            return childValue.call(this.container, event, ...parameters);
                        };
                        // } else if (typeof childValue === 'function') {
                        //     const parameters = this.parameterPaths.map(path => traverse(container.data, path));
                        //     return childValue.call(this.container, ...parameters);
                    } else {
                        return childValue;
                    }
                },

                set data(value: any) {
                    // if (names[0] === 'on') {
                    //     const source = traverse(container.methods, keys, 1);
                    //     source[property] = value;
                    // } else {

                    const parentValue = traverse(container.data, this.parentKeys);
                    const childValue = parentValue?.[this.childKey];

                    if (this.type === 'on') {
                        parentValue[this.childKey] = value;
                    } else if (typeof childValue === 'function') {
                        const parameters = this.parameterPaths.map(path => traverse(container.data, path));
                        childValue.call(this.container, ...parameters);
                    } else {
                        parentValue[this.childKey] = value;
                    }

                    // if (names[0] === 'value') {
                    //     source[property] = Piper(this, value);
                    // } else {
                    //     source[property] = value;
                    // }
                    // }
                }

            });

            this.data.set(pointer, binder);

            if (target.nodeName.includes('-')) {
                window.customElements.whenDefined(target.nodeName.toLowerCase()).then(() => this.render(binder));
            } else {
                this.render(binder);
            }

        });

    }

    async remove(node: Node) {
        const type = node.nodeType;

        if (type === EN) {
            const attributes = (node as Element).attributes;
            for (let i = 0; i < attributes.length; i++) {
                const attribute = attributes[i];
                this.unbind(attribute);
            }
        }

        this.unbind(node);

        let child = node.firstChild;
        while (child) {
            this.remove(child);
            child = child.nextSibling;
        }

    }

    async add(node: Node, container: any) {
        const type = node.nodeType;

        // if (type === AN) {
        //     if (node.name.indexOf(this.prefix) === 0) {
        //         this.bind(node, node.name, node.value, container, attribute);
        //     }
        // } else

        if (type === TN) {

            const start = node.textContent.indexOf(this.syntaxStart);
            if (start === -1) return;

            // if (start !== 0) node = node.splitText(start);
            if (start !== 0) node = (node as Text).splitText(start);

            const end = node.textContent.indexOf(this.syntaxEnd);
            if (end === -1) return;

            if (end + this.syntaxStart.length !== node.textContent.length) {
                // const split = node.splitText(end + this.syntaxEnd.length);
                const split = (node as Text).splitText(end + this.syntaxEnd.length);
                this.bind(node, 'text', node.textContent, container, node);
                this.add(split, container);
            } else {
                this.bind(node, 'text', node.textContent, container, node);
            }

        } else if (type === EN) {
            let skip = false;

            // const attributes = node.attributes;
            const attributes = (node as Element).attributes;
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

                    this.bind(node, name, value, container, attribute);
                }

            }

            if (skip) return;

            let child = node.firstChild;
            while (child) {
                this.add(child, container);
                child = child.nextSibling;
            }

        }
    }

}
