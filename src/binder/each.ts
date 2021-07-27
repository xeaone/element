
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

// const traverse = function (data: any, parent, path: string | string[]) {
//     const parts = typeof path === 'string' ? path.split('.') : path;
//     const part = parts.shift();
//     if (!part) return data;
//     if (part in parent) return traverse(data, parent[ part ], parts);
//     if (typeof data === 'object') return traverse(data[ part ], parent, parts);
//     return undefined;
// };

const has = () => true;
const get = (target, key) => typeof key === 'string' ? new Proxy({}, { has, get }) : undefined;

const setup = function (binder) {
    let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

    // binder.meta.keyPattern = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
    // binder.meta.indexPattern = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
    // binder.meta.variablePattern = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;

    // binder.meta.keyPattern = key ? new RegExp(`(;.*?\\b)(${key})(\\b.*?;)`, 'g') : null;
    // binder.meta.indexPattern = index ? new RegExp(`(;.*?\\b)(${index})(\\b.*?;)`, 'g') : null;
    // binder.meta.variablePattern = variable ? new RegExp(`(;.*?\\b)(${variable})(\\b.*?;)`, 'g') : null;

    // if (binder.rewrites) {
    //     for (const [ pattern, value ] of binder.rewrites) {
    //         path = path.replace(new RegExp(`\\b(${pattern})\\b`), value);
    //     }
    // }

    binder.meta.a = [];

    binder.meta.keyPattern = key ? key : null;
    binder.meta.indexPattern = index ? index : null;
    binder.meta.variablePattern = variable ? variable : null;

    binder.meta.path = path;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;
    binder.meta.pathParts = path.split('.');

    binder.meta.keys = [];
    binder.meta.count = 0;
    binder.meta.setup = true;
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;

    binder.meta.clone = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');

    let node = binder.owner.firstChild;
    while (node) {
        binder.meta.clone.content.appendChild(node);
        binder.meta.count++;
        node = binder.owner.firstChild;
    }

};

const each = async function (binder, message) {

    if (!binder.meta.setup) setup(binder);

    // const time = `each ${binder.meta.targetLength}`;
    // console.time(time);

    const data = await binder.compute();

    if (data.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.count;

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

            const dynamics = new Proxy({
                // ...binder.dynamics,

                [ binder.meta.keyName ]: undefined,
                [ binder.meta.indexName ]: undefined,
                [ binder.meta.variableName ]: undefined,

                // get [ binder.meta.keyName ] () { return keyValue; },
                // get [ binder.meta.indexName ] () { return indexValue; },
                // set [ binder.meta.variableName ] (value) {
                //     let data = binder.container.data;
                //     for (const part of binder.meta.pathParts) {
                //         if (part in this) data = this[ part ];
                //         else if (part in data) data = data[ part ];
                //         else return;
                //     }
                //     data[ keyValue ] = value;
                // },
                // get [ binder.meta.variableName ] () {
                //     let data = binder.container.data;
                //     for (const part of binder.meta.pathParts) {
                //         console.log(part);
                //         if (part in this) data = this[ part ];
                //         else if (part in data) data = data[ part ];
                //         else return;
                //     }

                //     return data[ keyValue ];
                // }
            }, {
                // has: (target, key) => {
                //     return binder.meta.keyName === key || binder.meta.indexName === key || binder.meta.variableName || key;
                // },
                get: (target, key) => {
                    if (typeof key !== 'string') return;
                    if (key === binder.meta.keyName) return keyValue;
                    if (key === binder.meta.indexName) return indexValue;
                    if (key === binder.meta.variableName) {
                        let data = binder?.dynamics ?? binder.container.data;
                        for (const part of binder.meta.pathParts) {
                            if (part in data) data = data[ part ];
                            // else return new Proxy({}, { has, get });
                            else return undefined;
                        }
                        return data[ keyValue ];
                    }
                },
                set: (target, key, value) => {
                    if (typeof key !== 'string') return;
                    if (key === binder.meta.variableName) {
                        let data = binder?.dynamics ?? binder.container.data;
                        for (const part of binder.meta.pathParts) {
                            if (part in data) data = data[ part ];
                            else return true;
                        }
                        data[ keyValue ] = value;
                        return true;
                    }
                }
            });

            const rewrites = [ ...(binder.rewrites || []) ];
            if (binder.meta.indexPattern) rewrites.unshift([ binder.meta.indexPattern, indexValue ]);
            if (binder.meta.keyPattern) rewrites.unshift([ binder.meta.keyPattern, keyValue ]);
            if (binder.meta.variablePattern) rewrites.unshift([ binder.meta.variablePattern, variableValue ]);

            // const d = document.createElement('div');
            // d.className = 'box';
            // const t = document.createTextNode('{{item.number}}');
            // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
            // d.appendChild(t);
            // binder.meta.templateElement.content.appendChild(d)

            const clone = binder.meta.clone.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                // binder.binder.add(node, binder.container, dynamics, rewrites);
                tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites));
                node = node.nextSibling;
            }

            binder.meta.templateElement.content.appendChild(clone);
            binder.meta.currentLength++;
        };

        if (binder.meta.busy) return;
        else binder.meta.busy = true;

        if (binder.meta.currentLength === binder.meta.targetLength) {
            binder.owner.appendChild(binder.meta.templateElement.content);
            binder.meta.busy = false;
        }

    }

};

export default each;