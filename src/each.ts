const whitespace = /\s+/;

export default {

    setup (binder: any) {

        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateLength = 0;
        binder.meta.queueElement = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');

        let node = binder.owner.firstChild;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue as string)) {
                binder.owner.removeChild(node);
            } else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }

    },

    reset (binder: any) {
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        while (binder.owner.lastChild) binder.release(binder.owner.removeChild(binder.owner.lastChild));
        while (binder.meta.queueElement.content.lastChild) binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
    },

    async render (binder: any) {
        const [ data, variable, key, index ] = binder.compute();
        const [ reference ] = binder.references;

        binder.meta.data = data;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variable = variable;
        binder.meta.reference = reference;

        if (data?.constructor === Array) {
            binder.meta.targetLength = data.length;
        } else if (data?.constructor === Object) {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        } else {
            return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
        }

        if (binder.meta.currentLength > binder.meta.targetLength) {
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength, node;

                while (count--) {
                    node = binder.owner.lastChild;
                    if (node) {
                        binder.owner.removeChild(node);
                        binder.container.release(node);
                    }
                }

                binder.meta.currentLength--;
            }
        } else if (binder.meta.currentLength < binder.meta.targetLength) {
            let clone, context, rewrites;
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const keyValue = binder.meta.keys?.[ binder.meta.currentLength ] ?? binder.meta.currentLength;
                const indexValue = binder.meta.currentLength++;

                rewrites = [
                    ...binder.rewrites,
                    [ binder.meta.variable, `${binder.meta.reference}.${keyValue}` ]
                ];

                context = new Proxy(binder.context, {
                    has: (target, key) =>
                        key === binder.meta.variable ||
                        key === binder.meta.keyName ||
                        key === binder.meta.indexName ||
                        Reflect.has(target, key),
                    get: (target, key, receiver) =>
                        key === binder.meta.keyName ? keyValue :
                            key === binder.meta.indexName ? indexValue :
                                key === binder.meta.variable ? Reflect.get(binder.meta.data, keyValue) :
                                    Reflect.get(target, key, receiver),
                    set: (target, key, value, receiver) =>
                        key === binder.meta.keyName ? true :
                            key === binder.meta.indexName ? true :
                                key === binder.meta.variable ? Reflect.set(binder.meta.data, keyValue, value) :
                                    Reflect.set(target, key, value, receiver)
                });

                let node = binder.meta.templateElement.content.firstChild;
                while (node) {
                    clone = node.cloneNode(true);
                    binder.container.register(clone, context, rewrites);
                    binder.meta.queueElement.content.appendChild(clone);
                    node = node.nextSibling;
                }

            }
        }

        if (binder.meta.currentLength === binder.meta.targetLength) {
            binder.owner.appendChild(binder.meta.queueElement.content);
        }

    }

};