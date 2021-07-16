
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

const setup = function (binder) {
    let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

    binder.meta.keyPattern = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
    binder.meta.indexPattern = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
    binder.meta.variablePattern = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;

    binder.meta.path = path;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;
    binder.meta.pathParts = path.split('.');

    binder.meta.keys = [];
    binder.meta.setup = true;
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.cloneLength = 0;

    binder.meta.clone = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');

    let node = binder.owner.firstChild;
    while (node) {
        binder.meta.clone.content.appendChild(node);
        binder.meta.cloneLength++;
        node = binder.owner.firstChild;
    }

};

const each = async function (binder) {

    if (!binder.meta.setup) await setup(binder);

    // const time = `each ${binder.meta.targetLength}`;
    // console.time(time);

    const data = await binder.compute();

    if (data instanceof Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.cloneLength;

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
            const variableValue = `${binder.meta.path}[${keyValue}]`;


            const dynamics = {
                ...binder.dynamics,
                [ binder.meta.keyName ]: keyValue,
                [ binder.meta.indexName ]: indexValue,
                set [ binder.meta.variableName ] (value) {
                    let data = binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in this) data = this[ part ];
                        else if (part in data) data = data[ part ];
                    }
                    data[ keyValue ] = value;
                },
                get [ binder.meta.variableName ] () {
                    let data = binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in this) data = this[ part ];
                        else if (part in data) data = data[ part ];
                    }
                    return data[ keyValue ];
                }
            };

            const rewrites = [ ...(binder.rewrites || []) ];
            if (binder.meta.indexPattern) rewrites.push([ binder.meta.indexPattern, indexValue ]);
            if (binder.meta.keyPattern) rewrites.push([ binder.meta.keyPattern, keyValue ]);
            if (binder.meta.variablePattern) rewrites.push([ binder.meta.variablePattern, variableValue ]);

            // const d = document.createElement('div');
            // d.className = 'box';
            // const t = document.createTextNode('{{item.number}}');
            // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
            // d.appendChild(t);
            // binder.meta.templateElement.content.appendChild(d)

            const clone = binder.meta.clone.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites));
                // tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics));
                // binder.binder.add(node, binder.container, dynamics);
                node = node.nextSibling;
            }

            binder.meta.templateElement.content.appendChild(clone);
            binder.meta.currentLength++;
        }

    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        // console.timeEnd(time);
        binder.owner.appendChild(binder.meta.templateElement.content);
        if (binder.owner.nodeName === 'SELECT') binder.owner.dispatchEvent(new Event('$renderEach'));
    }

};

export default each;