import Binder from './binder.js';
import Loader from './loader.js';
import Style from './style.js';
import Observer from './observer.js';
import Extend from './utility/extend.js';

export default Object.freeze({

    async setup (options) {
        options = options || {};

        if (options.components) {
            return Promise.all(options.components.map(component => {
                if (typeof component === 'string') {
                    return Loader.load(component).then(load => {
                        return this.define(load.default);
                    });
                } else {
                    return this.define(component);
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
            root = element.attachShadow({ mode: 'open' });
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

        // if (options.name in self.data) {
        //     return console.warn('Oxe.component.define - component defined: ${options.name}');
        // }
        //
        // self.data[options.name] = options;

        options.count = 0;
        options.model = options.model || {};
        options.adopt = options.adopt || false;
        options.methods = options.methods || {};
        options.shadow = options.shadow || false;
        options.name = options.name.toLowerCase();
        options.attributes = options.attributes || [];

        if (typeof options.style === 'string') {
            options.style = this.style(options.style, options.name);
            Style.append(options.style);
        }

        if (typeof options.template === 'string') {
            const data = document.createElement('div');
            data.innerHTML = options.template;
            options.template = data;
        }

        const OElement = function OElement () {
            const scope = `${options.name}-${options.count++}`;

            const handler = function (data, path) {
                const location = `${scope}.${path}`;
                const binders = Binder.data.get(location);
                if (!binders) return;
                for (let i = 0; i < binders.length; i++) {
                    Binder.render(binders[i], data);
                }
            };

            const model = Observer.create(options.model, handler);

            Object.defineProperties(this, {
                scope: { enumerable: true, value: scope },
                model: { enumerable: true, value: model },
                methods: { enumerable: true, value: options.methods }
            });

            if (options.properties) {
                Object.defineProperties(this, options.properties);
            }

        };

        if (options.prototype) {
            Object.assign(OElement.prototype, options.prototype);
        }

        OElement.prototype.observedAttributes = options.attributes;

        OElement.prototype.attributeChangedCallback = function () {
            if (options.attributed) options.attributed.apply(this, arguments);
        };

        OElement.prototype.adoptedCallback = function () {
            if (options.adopted) options.adopted.apply(this, arguments);
        };

        OElement.prototype.disconnectedCallback = function () {
            if (options.detached) options.detached.apply(this, arguments);
        };

        OElement.prototype.connectedCallback = function () {
            if (this.created) {
                if (options.attached) {
                    options.attached.call(this);
                }
            } else {
                this.created = true;

                self.render(this, options.template, options.adopt, options.shadow);

                if (options.created && options.attached) {
                    Promise.resolve().then(options.created.bind(this)).then(options.attached.bind(this));
                } else if (options.created) {
                    Promise.resolve().then(options.created.bind(this));
                } else if (options.attached) {
                    Promise.resolve().then(options.attached.bind(this));
                }

            }
        };

        window.customElements.define(options.name, Extend(OElement, HTMLElement));
    }

});
