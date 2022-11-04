const whitespace = /^\s*$/;
const next = Promise.resolve();
const textType = Node.TEXT_NODE;
const elementType = Node.ELEMENT_NODE;
const commentType = Node.COMMENT_NODE;
const documentType = Node.DOCUMENT_NODE;
const cdataType = Node.CDATA_SECTION_NODE;
const fragmentType = Node.DOCUMENT_FRAGMENT_NODE;

const create = (item) => {
    const { name, attributes = {}, children = [] } = item;
    const element = document.createElement(name);

    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('on')) {
            element.addEventListener(key.substring(2).toLowerCase(), (e) => value(e));
            // element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    }

    for (const child of children) {
        if (typeof child === 'string') {
            const text = document.createTextNode(child);
            element.appendChild(text);
        } else {
            element.appendChild(child);
        }
    }

    return element;
};

const patch = (source, target) => {
    if (target instanceof Array) {
        const targetChildren = target;
        const sourceChildren = source.childNodes ?? [];
        const sourceLength = sourceChildren.length;
        const targetLength = targetChildren.length;
        const commonLength = Math.min(sourceLength, targetLength);

        for (let index = 0; index < commonLength; index++) { // patch common nodes
            patch(sourceChildren[index], targetChildren[index]);
        }

        if (sourceLength > targetLength) { // remove additional nodes
            for (let index = targetLength; index < sourceLength; index++) {
                const child = source.lastChild;
                if (child) source.removeChild(child);
            }
        } else if (sourceLength < targetLength) { // append additional nodes
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
                source.parentNode?.replaceChild(document.createTextNode(target), source);
            }
        } else if (
            sourceName !== targetName || sourceType !== targetType
        ) {
            source.parentNode?.replaceChild(create(target), source);
        } else if (
            sourceType === textType || targetType === textType ||
            sourceType === cdataType || targetType === cdataType ||
            sourceType === commentType || targetType === commentType
        ) {
            if (source.children !== target.children) {
                source.parentNode?.replaceChild(create(target), source);
            }
        } else {

            const targetChildren = target.children;
            const sourceChildren = source.childNodes;
            const sourceLength = sourceChildren.length;
            const targetLength = targetChildren.length;
            const commonLength = Math.min(sourceLength, targetLength);

            for (let index = 0; index < commonLength; index++) { // patch common nodes
                patch(sourceChildren[index], targetChildren[index]);
            }

            if (sourceLength > targetLength) { // remove additional nodes
                for (let index = targetLength; index < sourceLength; index++) {
                    const child = source.lastChild;
                    if (child) source.removeChild(child);
                }
            } else if (sourceLength < targetLength) { // append additional nodes
                for (let index = sourceLength; index < targetLength; index++) {
                    const child = targetChildren[index];
                    // console.log(source);
                    source.appendChild(create(child));
                }
            }

            for (const name in source.attributes) {
                if (!(name in target.attributes)) {
                    source.removeAttribute(name);
                }
            }
        }
    }
};

const proxy = (data, event) => {
    return new Proxy(data, {
        get: (target, key, receiver) => {
            let value = Reflect.get(target, key, receiver);
            if (typeof value === 'function') value = value.bind(receiver);
            // console.log(value)
            return value;
        },
        set: (target, key, value, receiver) => {
            Reflect.set(target, key, value, receiver);
            next.then(event);
            return true;
        },
        apply: (...args) => {
            // console.log(args)
            return Reflect.apply(...args);
        }
    });
};

const element = new Proxy({}, {
    get(target, name) {
        return (attributes = [], ...children) => {
            const element = { name, attributes, children, type: Node.ELEMENT_NODE };
            return element;
        }
    }
});

export default class Virtual {
    #root;
    #context;
    #render;
    #patching = 0;
    #request = false;

    constructor(root, context, render) {
        this.#root = root;
        this.#render = render;
        this.#context = proxy(context(), () => this.render());
    }

    render() {
        clearTimeout(this.#patching);
        this.#patching = setTimeout(() => {
            patch(this.#root(), this.#render(this.#context, element));
            this.#patching = 0;
        }, 200);
    }

}
