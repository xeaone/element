
const space = /\s+/;
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

const each = async function (binder) {
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

        // binder.meta.tasks = [];

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
                binder.binder.remove(node);
            }

            binder.owner.$length--;
            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {

            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.meta.path}.${keyValue}`;

            const dynamics = new Proxy(binder.meta.dynamics || {}, {
                has (target, key) {
                    return key === binder.meta.indexName || key === binder.meta.keyName || key === binder.meta.variableName || key in target;
                },
                get (target, key) {
                    if (key === binder.meta.variableName) {
                        let result = binder.container.data;
                        for (const key of binder.meta.parts) {
                            result = result[ key ];
                            if (!result) return;
                        }
                        return typeof result === 'object' ? result[ keyValue ] : undefined;
                    } else if (key === binder.meta.indexName) {
                        return indexValue;
                    } else if (key === binder.meta.keyName) {
                        return keyValue;
                    } else {
                        return target[ key ];
                    }
                },
                set (target, key, value) {
                    if (key === binder.meta.variableName) {
                        let result = binder.container.data;
                        for (const key of binder.meta.parts) {
                            result = result[ key ];
                            if (!result) return true;
                        }
                        typeof result === 'object' ? result[ keyValue ] = value : undefined;
                    } else {
                        target[ key ] = value;
                    }
                    return true;
                }
            });

            const rewrites = [];
            if (binder.meta.indexName) rewrites.push([ binder.meta.indexName, indexValue ]);
            if (binder.meta.keyName) rewrites.push([ binder.meta.keyName, keyValue ]);
            if (binder.meta.variableName) rewrites.push([ binder.meta.variableName, variableValue ]);
            if (binder.rewrites) rewrites.push(...binder.rewrites);

            // const d = document.createElement('div');
            // d.className = 'box';
            // const t = document.createTextNode('{{item.number}}');
            // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
            // d.appendChild(t);
            // binder.meta.queueElement.content.appendChild(d)

            for (const child of binder.meta.templateElement.content.childNodes) {
                const node = child.cloneNode(true);
                // binder.owner.appendChild(node);
                binder.meta.queueElement.content.appendChild(node);
                binder.binder.add(node, binder.container, dynamics, rewrites, binder.meta.tasks);
            }

            binder.meta.currentLength++;
        }

    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.queueElement.content);

        binder.owner.$ready = true;

        if (binder.owner.nodeName === 'SELECT') {
            for (const option of binder.owner.options) {
                option.addEventListener('rendered:value', function () {
                    if (!option.$initialRender) binder.owner.$length++;
                    option.$initialRender = true;
                    if (!binder.owner.$ready || binder.owner.$length !== binder.owner.length) return;
                    window.requestAnimationFrame(() => binder.binder.get(binder.owner.attributes.value)?.forEach(b => b.render()));
                });
            }
        }

    }

};

export default each;