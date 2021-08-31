
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

const each = async function (binder) {

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (!binder.meta.setup) {
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

        // if (binder.owner.nodeName === 'SELECT') {
        //     binder.owner.$optionsReady = null;
        //     binder.owner.$optionsLength = 0;
        // }

        let node = binder.owner.firstChild;
        while (node) {
            binder.meta.templateLength++;
            binder.meta.templateElement.content.appendChild(node);
            node = binder.owner.firstChild;
        }

    }

    // const time = `each ${binder.meta.targetLength}`;
    // console.time(time);

    const tasks = [];
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
                tick.then(binder.binder.remove.bind(binder.binder, node));
            }

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


            // const template = binder.meta.templateElement.content.cloneNode(true);
            // let node = template.firstChild;
            // while (node) {
            //     // binder.meta.tasks.push(tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites)));
            //     tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites, binder.meta.tasks));
            //     node = node.nextSibling;
            // }
            // binder.meta.queueElement.content.appendChild(template)


            binder.meta.queueElement.content.appendChild(binder.meta.templateElement.content.cloneNode(true));
            tasks.push(tick.then(function (length, dynamics, rewrites) {
                const start = length * binder.meta.templateLength;
                const stop = start + binder.meta.templateLength;
                let index = start;
                while (index < stop) {
                    binder.binder.add(binder.meta.queueElement.content.childNodes[ index ], binder.container, dynamics, rewrites, binder.meta.tasks);
                    // tick.then(binder.binder.add.bind(binder.binder, binder.meta.queueElement.content.childNodes[ index ], binder.container, dynamics, rewrites, binder.meta.tasks));
                    index++;
                }
            }.bind(null, binder.meta.currentLength, dynamics, rewrites)));

            binder.meta.currentLength++;
        }

    };

    if (binder.meta.currentLength === binder.meta.targetLength) {
        tick.then(async () => {
            await Promise.all(tasks);
            await Promise.all(binder.meta.tasks);

            binder.owner.appendChild(binder.meta.queueElement.content);
            binder.meta.busy = false;
            if (binder.owner.nodeName === 'SELECT') {
                binder.owner.$ready = true;
                // binder.owner.$optionsReady = binder.owner.$optionsLength;
                // binder.owner.$optionsLength = binder.owner.options.length;
                binder.owner.dispatchEvent(new Event('$renderSelect'));
            }
        });

    }

};

export default each;