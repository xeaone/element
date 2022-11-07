let patching = 0;
const updates = [];
// const whitespace = /^\s*$/;
const next = Promise.resolve();
const textType = Node.TEXT_NODE;
// const elementType = Node.ELEMENT_NODE;
const commentType = Node.COMMENT_NODE;
// const documentType = Node.DOCUMENT_NODE;
const cdataType = Node.CDATA_SECTION_NODE;
// const fragmentType = Node.DOCUMENT_FRAGMENT_NODE;

const elementSymbol = Symbol('element');

export const elements = new Proxy({}, {
    get(_, name) {
        return (attributes, ...children) => {
            if (attributes?.constructor !== Object || attributes?.symbol === elementSymbol) {
                if (attributes !== undefined) {
                    children.unshift(attributes);
                }
                attributes = {};
            } else {
                attributes = attributes ?? {};
            }

            return {
                name,
                attributes,
                children,
                symbol: elementSymbol,
                type: Node.ELEMENT_NODE
            };
        };
    }
});

const frame = function () {
    while (updates.length) updates.shift()();
    patching = 0;
};

const schedule = function (update) {
    updates.push(update);
    cancelAnimationFrame(patching);
    patching = requestAnimationFrame(frame);
    // clearTimeout(patching);
    // patching = setTimeout(frame, 100);
};

const create = function (item) {
    const element = document.createElement(item.name);

    for (const name in item.attributes) {
        const value = item.attributes[name];
        if (name.startsWith('on')) {
            Reflect.set(element, `x${name}`, value);
            element.addEventListener(name.slice(2), value);
        } else {
            element.setAttribute(name, value);
        }
    }

    for (const child of item.children) {
        if (child?.symbol === elementSymbol) {
            element.appendChild(child);
        } else {
            element.appendChild(document.createTextNode(child));
        }
    }

    return element;
};

export const patch = function (source, target) {
    if (target instanceof Array) {
        const targetChildren = target;
        const sourceChildren = source.childNodes ?? [];
        const sourceLength = sourceChildren.length;
        const targetLength = targetChildren.length;
        const commonLength = Math.min(sourceLength, targetLength);

        for (let index = 0; index < commonLength; index++) {
            // patch common nodes
            patch(sourceChildren[index], targetChildren[index]);
        }

        if (sourceLength > targetLength) {
            // remove additional nodes
            for (let index = targetLength; index < sourceLength; index++) {
                const child = source.lastChild;
                if (child) source.removeChild(child);
            }
        } else if (sourceLength < targetLength) {
            // append additional nodes
            for (let index = sourceLength; index < targetLength; index++) {
                const child = targetChildren[index];
                source.appendChild(create(child));
            }
        }
    } else {
        const targetType = target.type;
        const targetName = target.name;
        const sourceType = source.nodeType;
        const sourceName = source.nodeName.toLowerCase();

        if (typeof source === 'string' || typeof target === 'string') {
            if (source.textContent !== target) {
                source.parentNode.replaceChild(document.createTextNode(target), source);
            }
        } else if (sourceName !== targetName || sourceType !== targetType) {
            source.parentNode.replaceChild(create(target), source);
        } else if (
            sourceType === textType ||
            targetType === textType ||
            sourceType === cdataType ||
            targetType === cdataType ||
            sourceType === commentType ||
            targetType === commentType
        ) {
            if (source.children !== target.children) {
                source.parentNode.replaceChild(create(target), source);
            }
        } else {
            const targetChildren = target.children;
            const sourceChildren = source.childNodes;
            const sourceLength = sourceChildren.length;
            const targetLength = targetChildren.length;
            const commonLength = Math.min(sourceLength, targetLength);

            for (const name in target.attributes) {
                const value = target.attributes[name];
                if (name.startsWith('on')) {
                    if (Reflect.has(source, `x${name}`)) {
                        source.addEventListener(name.slice(2), Reflect.get(source, `x${name}`));
                    } else {
                        Reflect.set(source, `x${name}`, value);
                        source.addEventListener(name.slice(2), value);
                    }
                    if (source.hasAttribute(name)) source.removeAttribute(name);
                } else if (source.getAttribute(name) !== `${value}`) {
                    source.setAttribute(name, value);
                }
            }

            for (const name in source.attributes) {
                if (!(name in target.attributes)) {
                    source.removeAttribute(name);
                }
            }

            for (let index = 0; index < commonLength; index++) {
                // patch common nodes
                patch(sourceChildren[index], targetChildren[index]);
            }

            if (sourceLength > targetLength) {
                // remove additional nodes
                let child;
                for (let index = targetLength; index < sourceLength; index++) {
                    child = source.lastChild;
                    if (child) source.removeChild(child);
                }
            } else if (sourceLength < targetLength) {
                // append additional nodes
                let child;
                for (let index = sourceLength; index < targetLength; index++) {
                    child = targetChildren[index];
                    source.appendChild(create(child));
                }
            }
        }
    }
};

export const proxy = function (data, event) {
    return new Proxy(data, {
        get(target, key, receiver) {
            let value = Reflect.get(target, key, receiver);
            if (typeof value === 'function') value = value.bind(receiver);
            return value;
        },
        set(target, key, value, receiver) {
            Reflect.set(target, key, value, receiver);
            next.then(event);
            return true;
        },
        apply(...args) {
            return Reflect.apply(...args);
        }
    });
};

export const render = function (root, context, component) {

    const update = function () {
        schedule(() => patch(root(), component()));
    };

    context = proxy(context(), update);
    component = component.bind(null, elements, context);

    update();
};

export class XElement extends HTMLElement {
  #root;
  #shadow;
  #context;
  #component;
  #created = false;

  constructor() {
    super();
    this.#shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

    const options = this.constructor.options ?? {};

    if (options.root === 'this') this.#root = this;
    else if (options.root === 'shadow') this.#root = this.shadowRoot;
    else this.#root = this.shadowRoot;

    if (options.slot === 'default') this.#shadow.appendChild(document.createElement('slot'));

    this.#context = proxy(this.constructor.context(), this.#update.bind(this));
    this.#component = this.constructor.component.bind(this.#context, elements, this.#context);

    if (this.#root !== this) {
      this.#created = true;
      this.#update();
    }
  }

  #update() {
    schedule(() => patch(this.#root, this.#component()));
  }

  connectedCallback() {
    if (!this.#created) {
      this.#created = true;
      this.#update();
    }
  }
}