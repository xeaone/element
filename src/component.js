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

            for (let i = 0, l = options.components.length; i < l; i++) {
                let component = options.components[i];

                if (typeof component === 'string') {
                    const load = await Loader.load(component);
                    component = load.default;
                }

                self.define(component);
            }

        }

    },

    style (style, name) {

        style.replace(/\n|\r|\t/g, '');

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

        style = style.replace(/:host/g, name);

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
            throw new Error('Oxe.component.define - component defined');
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

        options.properties.created = {
            get () { return this._created; }
        };

        options.properties.scope = {
            get () { return this._scope; }
        };

        options.properties.methods = {
            get () { return Methods.get(this.scope); }
        };

        options.properties.model = {
            get () { return Model.get(this.scope); },
            set (data) {
                return Model.set(this.scope, data && typeof data === 'object' ? data : {});
            }
        };

        options.properties.observedAttributes = {
            value: options.attributes
        };

        options.properties.attributeChangedCallback = {
            value () {
                if (options.attributed) options.attributed.apply(this, arguments);
            }
        };

        options.properties.adoptedCallback = {
            value () {
                if (options.adopted) options.adopted.apply(this, arguments);
            }
        };

        options.properties.disconnectedCallback = {
            value () {
                if (options.detached) options.detached.call(this);
            }
        };

        options.properties.connectedCallback = {
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
        };

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

            const methods = Utility.clone(options.methods);
            const model = Utility.clone(options.model);

            Methods.set(this.scope, methods);
            Model.set(this.scope, model);
        };

        Object.defineProperties(constructor.prototype, options.properties);
        Definer.define(options.name, constructor);
    }

};
