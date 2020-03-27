import Observer from './observer.js';
import Binder from './binder.js';
import Style from './style.js';

const Slot = function (element, fragment) {
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

};

const Fragment = function (element, template, adopt) {
    const fragment = document.createDocumentFragment();
    const clone = template.cloneNode(true);

    let child = clone.firstElementChild;
    while (child) {

        if (!adopt) {
            Binder.add(child, element, element.scope);
        }

        fragment.appendChild(child);
        child = clone.firstElementChild;
    }

    return fragment;
};

const Render = function (element, template, adopt, shadow) {
    if (!template) return;

    const fragment = Fragment(element, template);

    let root;

    if (shadow && 'attachShadow' in document.body) {
        root = element.attachShadow({ mode: 'open' });
    } else if (shadow && 'createShadowRoot' in document.body) {
        root = element.createShadowRoot();
    } else {

        if (fragment) {
            Slot(element, fragment);
        }

        root = element;
    }

    if (fragment) {
        root.appendChild(fragment);
    }

    if (adopt) {
        let child = root.firstElementChild;
        while (child) {
            Binder.add(child, element, element.scope);
            child = child.nextElementSibling;
        }
    }

};

let COUNT = 0;

const Component = function Component (options = {}) {
    const count = COUNT++;
    const self = window.Reflect.construct(HTMLElement, arguments, this.constructor);
    const name = self.nodeName.toLowerCase();
    const scope = `${name}-${count}`;

    const style = options.style || self.style;
    const methods = options.methods || this.methods;
    const template = options.template || self.template;

    self.options = { ...options };
    self.options.adopt = false;
    self.options.shadow = false;
    self.options.attributes = [];

    if (typeof style === 'string') {
        Style.append(
            style
                .replace(/\n|\r|\t/g, '')
                .replace(/:host/g, name)
        );
    }

    if (typeof template === 'string') {
        // const data = document.createElement('div');
        // data.innerHTML = template;
        // template = data;
        self.template = new DOMParser()
            .parseFromString(template, 'text/html')
            .body;
    }

    const handler = function (data, path) {
        const location = `${scope}.${path}`;
        Binder.data.forEach(binder => {
            if (binder.location === location) {
                Binder.render(binder);
            }
        });
    };

    const model = Observer.create(options.model || this.model || {}, handler);

    Object.defineProperties(self, {
        scope: { enumerable: true, value: scope },
        model: { enumerable: true, value: model },
        methods: { enumerable: true, value: methods }
    });

    // if (options.properties) {
    //     Object.defineProperties(self, options.properties);
    // }

    return self;
};

Component.prototype = Object.create(HTMLElement.prototype);
Object.defineProperty(Component.prototype, 'constructor', { enumerable: false, writable: true, value: Component });

// Component.observedAttributes = options.attributes;

Component.prototype.attributeChangedCallback = function () {
    if (this.attributed) Promise.resolve().then(this.attributed.apply(this, arguments));
};

Component.prototype.adoptedCallback = function () {
    if (this.adopted) Promise.resolve().then(this.adopted);
};

Component.prototype.disconnectedCallback = function () {
    if (this.detached) Promise.resolve().then(this.detached);
};

Component.prototype.connectedCallback = function () {
    if (this.CREATED) {
        if (this.options.attached) {
            this.options.attached.call(this);
        }
    } else {
        this.CREATED = true;

        Render(this, this.template, this.adopt, this.shadow);

        if (this.created && this.attached) {
            Promise.resolve().then(this.created).then(this.attached);
        } else if (this.created) {
            Promise.resolve().then(this.created);
        } else if (this.attached) {
            Promise.resolve().then(this.attached);
        }

    }
};

export default Component;
