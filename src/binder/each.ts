const space = /\s+/;
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

// const nextFrame = async function () {
//     return new Promise((resolve: any) =>
//         window.requestAnimationFrame(() =>
//             window.requestAnimationFrame(() => resolve())
//         )
//     );
// };

const wait = async function () {
    return new Promise((resolve: any) => setTimeout(() => resolve(), 0));
};

const eachHas = function (binder, indexValue, keyValue, target, key) {
    return key === binder.meta.variableName ||
        key === binder.meta.indexName ||
        key === binder.meta.keyName ||
        key in target;
};

const eachGet = function (binder, indexValue, keyValue, target, key) {
    if (key === binder.meta.variableName) {
        let result = binder.context;
        for (const part of binder.meta.parts) {
            result = result[ part ];
            if (!result) return;
        }
        return typeof result === 'object' ? result[ keyValue ] : undefined;
    } else if (key === binder.meta.indexName) {
        return indexValue;
    } else if (key === binder.meta.keyName) {
        return keyValue;
    } else {
        return binder.context[ key ];
    }
};

const eachSet = function (binder, indexValue, keyValue, target, key, value) {
    if (key === binder.meta.variableName) {
        let result = binder.context;
        for (const part of binder.meta.parts) {
            result = result[ part ];
            if (!result) return true;
        }
        typeof result === 'object' ? result[ keyValue ] = value : undefined;
    } else if (key === binder.meta.indexName || key === binder.meta.keyName) {
        return true;
    } else {
        binder.context[ key ] = value;
    }
    return true;
};

const eachUnrender = async function (binder) {
    binder.meta.tasks = [];
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    return Promise.all([
        (async () => {
            let node;
            while (node = binder.owner.lastChild) binder.binder.remove(binder.owner.removeChild(node));
        })(),
        (async () => {
            let node;
            while (node = binder.meta.queueElement.content.lastChild) binder.meta.queueElement.content.removeChild(node);
        })()
    ]);
};

const eachRender = async function (binder) {

    if (!binder.meta.setup) {
        binder.node.value = '';

        const [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.parts = path.split('.');
        binder.meta.variableName = variable;
        binder.meta.variableNamePattern = new RegExp(`(^|[^.a-zA-Z0-9$_])(${variable})\\b`);
        // binder.meta.variableNamePattern = new RegExp(`^${variable}\\b`);
        // binder.meta.variableNamePattern = new RegExp(`([^.a-zA-Z0-9$_\\[\\]])(${variable})\\b`);

        binder.meta.keys = [];
        binder.meta.tasks = [];
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.templateLength = 0;
        binder.meta.queueElement = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');

        let node = binder.owner.firstChild;
        while (node) {
            if (space.test(node.nodeValue)) {
                binder.owner.removeChild(node);
            } else {
                binder.meta.templateLength++;
                binder.meta.templateElement.content.appendChild(node);
            }
            node = binder.owner.firstChild;
        }

    }

    const data = await binder.compute();
    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.templateLength;

            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                binder.meta.tasks.push(binder.binder.remove(node));
            }

            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {

            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength;

            const variableValue = `${binder.meta.path}.${binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength}`;
            const context = new Proxy(binder.context, {
                has: eachHas.bind(null, binder, indexValue, keyValue),
                get: eachGet.bind(null, binder, indexValue, keyValue),
                set: eachSet.bind(null, binder, indexValue, keyValue),
            });

            const rewrites = binder.rewrites?.slice() || [];
            if (binder.meta.keyName) rewrites.unshift([ binder.meta.keyName, keyValue ]);
            // if (binder.meta.indexName) rewrites.unshift([ binder.meta.indexName, indexValue ]);
            // if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableName, variableValue ]);
            if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableNamePattern, variableValue ]);

            const clone = binder.meta.templateElement.content.cloneNode(true);
            let node = clone.firstChild;
            if (node) {
                do {
                    binder.meta.tasks.push(binder.binder.add(node, binder.container, context, rewrites));
                } while (node = node.nextSibling);
            }

            binder.meta.queueElement.content.appendChild(clone);

            // var d = document.createElement('div');
            // d.classList.add('box');
            // var t = document.createTextNode('{{item.number}}');
            // binder.meta.tasks.push(binder.binder.add(t, binder.container, context, rewrites));
            // d.appendChild(t);
            // binder.meta.queueElement.content.appendChild(d);

            binder.meta.currentLength++;
        }
    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        await Promise.all(binder.meta.tasks.splice(0, binder.meta.length - 1));
        binder.owner.appendChild(binder.meta.queueElement.content);
        await wait();
    }

    if (binder.owner.nodeName === 'SELECT') {
        binder.binder.nodeBinders.get(binder.owner.attributes[ 'value' ])?.render();
    }

};

export default { render: eachRender, unrender: eachUnrender };