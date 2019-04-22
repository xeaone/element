import Methods from './methods.js';
import Binder from './binder.js';
import Loader from './loader.js';
import Model from './model.js';
import Style from './style.js';

export default {

    data: {},
    compiled: false,

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

        if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':host')) {
            style = style.replace(/:host/g, name);
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

    fragment (element, options) {
        const fragment = document.createDocumentFragment();
        const clone = options.clone.cloneNode(true);

        while (clone.firstElementChild) {

            Binder.add(clone.firstElementChild, {
                container: element,
                scope: element.scope
            });

            fragment.appendChild(clone.firstElementChild);

        }

        return fragment;
    },

    render (element, options) {

        if (this.compiled && element.parentElement.nodeName === 'O-ROUTER') {
            return;
        }

        if (!options.template) {
            return;
        }

        const fragment = this.fragment(element, options);

        if (options.shadow) {
            if ('attachShadow' in document.body) {
                element.attachShadow({ mode: 'open' }).appendChild(fragment);
            } else if ('createShadowRoot' in document.body) {
                element.createShadowRoot().appendChild(fragment);
            }
        } else {
            this.slot(element, fragment);
            element.appendChild(fragment);
        }

    },

    define (options) {
        const self = this;

        if (!options.name) throw new Error('Oxe.component.define - requires name');

        options.name = options.name.toLowerCase();

        if (options.name in self.data) throw new Error('Oxe.component.define - component previously defined');

        self.data[options.name] = options;

        options.count = 0;
        options.style = options.style || '';
        options.model = options.model || {};
        options.methods = options.methods || {};
        options.shadow = options.shadow || false;
        options.template = options.template || '';
        options.properties = options.properties || {};
        options.attributes = options.attributes || [];

        if (options.style) {
            const style = this.style(options.style, options.name);
            Style.append(style);
        }

        if (options.template) {
            options.clone = document.createElement('div');
            options.clone.innerHTML = options.template;
        }

        options.construct = function () {
            const instance = window.Reflect.construct(HTMLElement, [], this.constructor);

            options.properties.created = {
                value: false,
                enumerable: true,
                configurable: true
            };

            options.properties.scope = {
                enumerable: true,
                value: options.name + '-' + options.count++
            };

            options.properties.model = {
                enumerable: true,
                get: function () {
                    return Model.get(this.scope);
                },
                set: function (data) {
                    return Model.set(this.scope, data && typeof data === 'object' ? data : {});
                }
            };

            options.properties.methods = {
                enumerable: true,
                get: function () {
                    return Methods.get(this.scope);
                }
            };

            Object.defineProperties(instance, options.properties);
            Model.set(instance.scope, options.model);
            Methods.set(instance.scope, options.methods);

            return instance;
        };

        options.construct.observedAttributes = options.attributes;

        options.construct.prototype.attributeChangedCallback = function () {
            if (options.attributed) options.attributed.apply(this, arguments);
        };

        options.construct.prototype.adoptedCallback = function () {
            if (options.adopted) options.adopted.call(this);
        };

        options.construct.prototype.connectedCallback = function () {

            if (!this.created) {

                self.render(this, options);

                Object.defineProperty(this, 'created', {
                    value: true,
                    enumerable: true,
                    configurable: false
                });

                if (options.created) {
                    options.created.call(this);
                }

            }

            if (options.attached) {
                options.attached.call(this);
            }
        };

        options.construct.prototype.disconnectedCallback = function () {
            if (options.detached) {
                options.detached.call(this);
            }
        };

        Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
        Object.setPrototypeOf(options.construct, HTMLElement);

        window.customElements.define(options.name, options.construct);
    }

};
