import { BinderType, RewritesType } from './types.ts';
import { BinderHandle } from './binder.ts';

const eachWhitespace = /\s+/;
const eachText = Node.TEXT_NODE;

const eachSetup = function (binder: BinderType) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.queueElement = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');

    let node = binder.owner.firstChild;
    while (node) {
        if (node.nodeType === eachText && eachWhitespace.test(node.nodeValue)) {
            binder.owner.removeChild(node);
        } else {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
        }
        node = binder.owner.firstChild;
    }
};

const eachRender = async function (binder: BinderType) {
    if (binder.meta.busy) console.log(binder);
    if (binder.meta.busy) return;
    else binder.meta.busy = true;

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
        return console.error(`XElement - Each Binder ${binder.name} ${binder.value} requires Array or Object`);
    }

    console.time('each render');

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.templateLength, node;

            while (count--) {
                node = binder.owner.lastChild;
                if (node) {
                    binder.owner.removeChild(node);
                    // tasks.push(binder.container.release(node));
                }
            }

            binder.meta.currentLength--;
        }

        if (binder.meta.currentLength === binder.meta.targetLength) {
            // await Promise.all(tasks);
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, context, rewrites: RewritesType;
        while (binder.meta.currentLength < binder.meta.targetLength) {
            const keyValue = binder.meta.keys?.[binder.meta.currentLength] ?? binder.meta.currentLength;
            const indexValue = binder.meta.currentLength++;

            rewrites = [
                ...binder.rewrites,
                [binder.meta.variable, `${binder.meta.path}.${keyValue}`],
            ];

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

            // clone = binder.meta.templateElement.cloneNode(true).content;
            // tasks.push(BinderHandle(context, binder.binders, rewrites, clone));
            // binder.meta.queueElement.content.appendChild(clone);

            let node = binder.meta.templateElement.content.firstChild;
            while (node) {
                clone = node.cloneNode(true);
                tasks.push(BinderHandle(context, binder.binders, rewrites, clone));
                binder.meta.queueElement.content.appendChild(clone);
                node = node.nextSibling;
            }
        }

        if (binder.meta.currentLength === binder.meta.targetLength) {
            await Promise.all(tasks);
            binder.owner.appendChild(binder.meta.queueElement.content);
        }
    }
    binder.meta.busy = false;
    console.timeEnd('each render');
};

const eachReset = function (binder: BinderType) {
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    // while (binder.owner.lastChild) binder.container.release(binder.owner.removeChild(binder.owner.lastChild));
    while (binder.meta.queueElement.content.lastChild) binder.meta.queueElement.content.removeChild(binder.meta.queueElement.content.lastChild);
};

const eachDefault = { setup: eachSetup, render: eachRender, reset: eachReset };

export default eachDefault;
