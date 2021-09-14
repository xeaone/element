const space = /\s+/;
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

console.warn('move each proxy item to the binder proxy creation');

const each = async function (binder, data) {

    binder.owner.$ready = false;

    if (!binder.meta.setup) {
        binder.owner.$length = 0;

        let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

        if (binder.rewrites) {
            for (const [ name, value ] of binder.rewrites) {
                path = path.replace(new RegExp(`^(${name})\\b`), value);
            }
        }

        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        binder.meta.parts = path.split('.');

        binder.meta.tasks = [];
        binder.meta.keys = [];
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

    if (!data) {
        data = await binder.compute();

        if (data?.constructor === Array) {
            binder.meta.targetLength = data.length;
        } else {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.templateLength;

            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                binder.binder.remove(node);
            }

            binder.owner.$length--;
            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        let clone, node, rewrites, context, variableValue, keyValue, indexValue;
        while (binder.meta.currentLength < binder.meta.targetLength) {

            indexValue = binder.meta.currentLength;
            keyValue = binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength;

            variableValue = `${binder.meta.path}.${binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength}`;
            context = binder.context;

            // variableValue = `${binder.meta.path}.${binder.meta.keys[ binder.meta.currentLength ] ?? binder.meta.currentLength}`;
            // context = new Proxy({}, {
            //     has (target, key) {
            //         return true;
            //     },
            //     get: function (binder, indexValue, keyValue, target, key) {
            //         if (key === binder.meta.variableName) {
            //             let result = binder.context;
            //             // let result = binder.container.data;
            //             for (const key of binder.meta.parts) {
            //                 result = result[ key ];
            //                 if (!result) return;
            //             }
            //             return typeof result === 'object' ? result[ keyValue ] : undefined;
            //         } else if (key === binder.meta.indexName) {
            //             return indexValue;
            //         } else if (key === binder.meta.keyName) {
            //             return keyValue;
            //         } else {
            //             // return binder.container.data[ key ];
            //             return binder.context[ key ];
            //         }
            //     }.bind(null, binder, indexValue, keyValue),
            //     set: function (binder, indexValue, keyValue, target, key, value) {
            //         if (key === binder.meta.variableName) {
            //             let result = binder.context;
            //             // let result = binder.container.data;
            //             for (const key of binder.meta.parts) {
            //                 result = result[ key ];
            //                 if (!result) return true;
            //             }
            //             typeof result === 'object' ? result[ keyValue ] = value : undefined;
            //         } else {
            //             // return binder.container.data[ key ];
            //             binder.context[ key ] = value;
            //         }
            //         return true;
            //     }.bind(null, binder, indexValue, keyValue),
            // });

            rewrites = binder.rewrites?.slice() || [];
            if (binder.meta.indexName) rewrites.unshift([ binder.meta.indexName, indexValue, 'index' ]);
            if (binder.meta.keyName) rewrites.unshift([ binder.meta.keyName, keyValue, 'key' ]);
            if (binder.meta.variableName) rewrites.unshift([ binder.meta.variableName, variableValue, 'variable' ]);
            // rewrites = [];
            // if (binder.meta.indexName) rewrites.push([ binder.meta.indexName, indexValue, 'index' ]);
            // if (binder.meta.keyName) rewrites.push([ binder.meta.keyName, keyValue, 'key' ]);
            // if (binder.meta.variableName) rewrites.push([ binder.meta.variableName, variableValue, 'variable' ]);
            // if (binder.rewrites) rewrites.push(...binder.rewrites);

            clone = binder.meta.templateElement.content.cloneNode(true);
            node = clone.firstChild;
            if (node) {
                do {
                    binder.meta.tasks.push(binder.binder.add(node, binder.container, context, rewrites));
                } while (node = node.nextSibling);
            }

            binder.owner.appendChild(clone);

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
        binder.owner.$ready = true;

        if (binder.owner.nodeName === 'SELECT') {
            binder.owner.attributes?.value?.$binder.render();
        }

    }

};

export default each;