const whitespace = /\s+/;

export default {

    reset (binder: any) {
        const owner = (binder.node as Attr).ownerElement;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        while (owner && owner.lastChild) binder.release(owner.removeChild(owner.lastChild));
        while (binder.meta.queueElement.content.lastChild) binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
    },

    render (binder: any) {
        const [ data, variable, key, index ] = binder.compute();
        const [ reference ] = binder.references;
        const owner = (binder.node as Attr).ownerElement as Element;

        binder.meta.data = data;
        binder.meta.keyName = key;
        binder.meta.indexName = index;

        binder.meta.variable = variable;
        binder.meta.reference = reference;

        if (!binder.meta.setup) {
            binder.node.nodeValue = '';

            binder.meta.keys = [];
            binder.meta.setup = true;
            binder.meta.targetLength = 0;
            binder.meta.currentLength = 0;
            binder.meta.templateLength = 0;
            binder.meta.queueElement = document.createElement('template');
            binder.meta.templateElement = document.createElement('template');

            let node = owner.firstChild;
            while (node) {
                if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue as string)) {
                    owner.removeChild(node);
                } else {
                    binder.meta.templateLength++;
                    binder.meta.templateElement.content.appendChild(node);
                }
                node = owner.firstChild;
            }

        }

        if (data?.constructor === Array) {
            binder.meta.targetLength = data.length;
        } else {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }

        if (binder.meta.currentLength > binder.meta.targetLength) {
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength, node;

                while (count--) {
                    node = owner.lastChild;
                    if (node) {
                        owner.removeChild(node);
                        binder.container.release(node);
                    }
                }

                binder.meta.currentLength--;
            }
        } else if (binder.meta.currentLength < binder.meta.targetLength) {



            while (binder.meta.currentLength < binder.meta.targetLength) {
                // const clone = binder.meta.templateElement.content.cloneNode(true);
                const keyValue = binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength;
                const indexValue = binder.meta.currentLength++;

                const rewrites = [
                    ...binder.rewrites,
                    [ binder.meta.variable, `${binder.meta.reference}.${keyValue}` ]
                ];

                const context = new Proxy(binder.context, {
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
                    binder.container.register(
                        binder.meta.queueElement.content.appendChild(node.cloneNode(true)),
                        context,
                        rewrites
                    );
                    node = node.nextSibling;
                }

                // let node = clone.firstChild;
                // while (node) {
                //     binder.register(node, binder.context, rewrites);
                //     node = node.nextSibling;
                // }

                // binder.meta.queueElement.content.appendChild(clone);
            }
        }
        // console.timeEnd('each');

        if (binder.meta.currentLength === binder.meta.targetLength) {
            owner.appendChild(binder.meta.queueElement.content);
        }

    }

};