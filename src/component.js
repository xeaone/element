import Methods from './methods.js';
import Binder from './binder.js';
import Loader from './loader.js';
import Model from './model.js';
import Style from './style.js';
import Utility from './utility.js';
import Definer from './definer.js';

export default {

    data: {},

    async setup (options) {
        const self = this;

        options = options || {};

        if (options.components) {
            return Promise.all(options.components.map(function (component) {
                if (typeof component === 'string') {
                    return Loader.load(component).then(function (load) {
                        return self.define(load.default);
                    });
                } else {
                    return self.define(component);
                }
            }));
        }

    },

    style (style, name) {

        style = style.replace(/\n|\r|\t/g, '');
        style = style.replace(/:host/g, name);

        if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
            const matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];
            for (let i = 0, l = matches.length; i < l; i++) {
                const match = matches[i];
                const rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
                const pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
                style = style.replace(rule[0], '');
                style = style.replace(pattern, rule[2]);
            }
        }

        return style;
    },

    slot (element, fragment) {
        const fragmentSlots = fragment.querySelectorAll('slot[name]');
        const defaultSlot = fragment.querySelector('slot:not([name])');

        for (let i = 0, l = fragmentSlots.length; i < l; i++) {

            const fragmentSlot = fragmentSlots[i];
            const name = fragmentSlot.getAttribute('name');
            const elementSlot = element.querySelector('[slot="'+ name + '"]');

            if (elementSlot) {
                fragmentSlot.parentNode.replaceChild(elementSlot, fragmentSlot);
            } else {
                fragmentSlot.parentNode.removeChild(fragmentSlot);
            }

        }

        if (defaultSlot) {

            if (element.children.length) {

                while (element.firstChild) {
                    defaultSlot.parentNode.insertBefore(element.firstChild, defaultSlot);
                }

            }

            defaultSlot.parentNode.removeChild(defaultSlot);
        }

    },

    fragment (element, template, adopt) {
        const fragment = document.createDocumentFragment();
        const clone = template.cloneNode(true);

        let child = clone.firstElementChild;
        while (child) {

            if (!adopt) {
                Binder.add(child, { container: element, scope: element.scope });
            }

            fragment.appendChild(child);
            child = clone.firstElementChild;
        }

        return fragment;
    },

    render (element, template, adopt, shadow) {

        if (!template) {
            return;
        }

        const fragment = this.fragment(element, template);

        let root;

        if (shadow && 'attachShadow' in document.body) {
            root = element.attachShadow({ mode: 'open' })
        } else if (shadow && 'createShadowRoot' in document.body) {
            root = element.createShadowRoot();
        } else {

            if (fragment) {
                this.slot(element, fragment);
            }

            root = element;
        }

        if (fragment) {
            root.appendChild(fragment);
        }

        if (adopt) {
            let child = root.firstElementChild;
            while (child) {
                Binder.add(child, { container: element, scope: element.scope });
                child = child.nextElementSibling;
            }
        }

    },

    define (options) {
        const self = this;

        if (typeof options !== 'object') {
            return console.warn('Oxe.component.define - invalid argument type');
        }

        if (options.constructor === Array) {

            for (let i = 0, l = options.length; i < l; i++) {
                self.define(options[i]);
            }

            return;
        }

        if (!options.name) {
            return console.warn('Oxe.component.define - requires name');
        }

        options.name = options.name.toLowerCase();

        if (options.name in self.data) {
            console.log(options.name);
            return console.warn('Oxe.component.define - component defined');
        }

        self.data[options.name] = options;

        options.count = 0;
        options.model = options.model || {};
        options.adopt = options.adopt || false;
        options.methods = options.methods || {};
        options.shadow = options.shadow || false;
        options.attributes = options.attributes || [];
        options.properties = options.properties || {};

        if (options.style) {
            options.style = this.style(options.style, options.name);
            Style.append(options.style);
        }

        if (options.template && typeof options.template === 'string') {
            const data = document.createElement('div');
            data.innerHTML = options.template;
            options.template = data;
        }

        const constructor = function () {
            this._created = false;
            this._scope = options.name + '-' + options.count++;

            // Object.defineProperties(this, {
            //     created: {
            //         value: false,
            //         enumerable: true,
            //         configurable: true
            //     },
            //     scope: {
            //         enumerable: true,
            //         value: scope
            //     }
            // });

            const properties = Utility.clone(options.properties);
            const methods = Utility.clone(options.methods);
            const model = Utility.clone(options.model);

            Object.defineProperties(this, properties);
            Methods.set(this.scope, methods);
            Model.set(this.scope, model);
        };

        Object.defineProperties(constructor.prototype, {
            created: {
                get () { return this._created; }
            },
            scope: {
                get () { return this._scope; }
            },
            methods: {
                get () { return Methods.get(this.scope); }
            },
            model: {
                get () { return Model.get(this.scope); },
                set (data) {
                    return Model.set(this.scope, data && typeof data === 'object' ? data : {});
                }
            },
            observedAttributes: {
                value: options.attributes
            },
            attributeChangedCallback: {
                value () {
                    if (options.attributed) options.attributed.apply(this, arguments);
                }
            },
            adoptedCallback: {
                value () {
                    if (options.adopted) options.adopted.apply(this, arguments);
                }
            },
            disconnectedCallback: {
                value () {
                    if (options.detached) options.detached.call(this);
                }
            },
            connectedCallback: {
                value () {
                    const instance = this;

                    if (instance.created) {
                        if (options.attached) {
                            options.attached.call(instance);
                        }
                    } else {
                        instance._created = true;

                        self.render(instance, options.template, options.adopt, options.shadow);

                        Promise.resolve().then(function () {
                            if (options.created) {
                                return options.created.call(instance);
                            }
                        }).then(function () {
                            if (options.attached) {
                                return options.attached.call(instance);
                            }
                        });

                    }
                }
            }
        });

        Definer.define(options.name, constructor);
    }

};
