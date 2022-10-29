import { BinderType, RewritesType } from './types.ts';
import { BinderAdd, BinderRemove } from './binder.ts';

const eachWhitespace = /^\s*$/;
const eachText = Node.TEXT_NODE;

const eachSetup = function (binder: BinderType) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');

    let node = binder.owner.firstChild;
    while (node) {
        if (node.nodeType === eachText && node.nodeValue && eachWhitespace.test(node.nodeValue)) {
            binder.owner.removeChild(node);
        } else {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
        }
        node = binder.owner.firstChild;
    }
};

const eachRender = async function (binder: BinderType) {
    const tasks = [];
    const [path] = binder.paths;
    const [data, variable, key, index] = await binder.compute();

    binder.meta.data = data;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variable = variable;
    binder.meta.path = path;

    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else if (data?.constructor === Object) {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    } else {
        binder.meta.data = [];
        binder.meta.targetLength = 0;
        console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        let count, node;
        while (binder.meta.currentLength > binder.meta.targetLength) {
            count = binder.meta.templateLength;

            while (count--) {
                node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                tasks.push(BinderRemove(binder.binders, node));
            }

            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, first, last, context, rewrites: RewritesType;
        while (binder.meta.currentLength < binder.meta.targetLength) {
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;

            rewrites = [...binder.rewrites, [binder.meta.variable, `${binder.meta.path}.${keyValue}`]];

            context = new Proxy(binder.context, {
                has: function eachHas(target, key) {
                    if (key === binder.meta.keyName) return true;
                    if (key === binder.meta.indexName) return true;
                    if (key === binder.meta.variable) return true;
                    return Reflect.has(target, key);
                },
                get: function eachGet(target, key, receiver) {
                    if (key === binder.meta.keyName) return keyValue;
                    if (key === binder.meta.indexName) return indexValue;
                    if (key === binder.meta.variable) return Reflect.get(binder.meta.data, keyValue, receiver);
                    return Reflect.get(target, key, receiver);
                },
                set: function eachSet(target, key, value, receiver) {
                    if (key === binder.meta.keyName) return true;
                    if (key === binder.meta.indexName) return true;
                    if (key === binder.meta.variable) return Reflect.set(binder.meta.data, keyValue, value, receiver);
                    return Reflect.set(target, key, value, receiver);
                },
            });

            clone = binder.meta.templateElement.content.cloneNode(true);
            first = clone.firstChild;
            last = clone.lastChild;
            binder.meta.queueElement.content.appendChild(clone);

            tasks.push(BinderAdd(context, binder.binders, rewrites, binder.meta.queueElement.content, first, last));
        }
    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        await Promise.all(tasks);
        binder.owner.appendChild(binder.meta.queueElement.content);
    }
};

const eachReset = async function (binder: BinderType) {
    const tasks = [];

    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;

    while (binder.owner.lastChild) {
        tasks.push(BinderRemove(
            binder.binders,
            binder.owner.removeChild(binder.owner.lastChild),
        ));
    }

    while (binder.meta.queueElement.content.lastChild) {
        tasks.push(BinderRemove(
            binder.binders,
            binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild),
        ));
    }

    await Promise.all(tasks);
};

const eachDefault = { setup: eachSetup, render: eachRender, reset: eachReset };

export default eachDefault;
