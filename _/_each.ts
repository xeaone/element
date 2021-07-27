
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

const each = async function (binder, message?: string) {

    if (!binder.meta.setup) {
        let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

        binder.meta.keyPattern = key ? key : null;
        binder.meta.indexPattern = index ? index : null;
        binder.meta.variablePattern = variable ? variable : null;

        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        binder.meta.pathParts = path.split('.');

        binder.meta.busy = false;

        binder.meta.setup = true;
        binder.meta.appends = [];
        binder.meta.removes = [];
        binder.meta.keys = [];
        // binder.meta.keys = Object.keys(await binder.compute() || {});

        binder.meta.length = 0;
        binder.meta.count = 0;
        binder.meta.clone = document.createElement('template');
        let node = binder.owner.firstChild;
        while (node) {
            binder.meta.clone.content.appendChild(node);
            binder.meta.count++;
            node = binder.owner.firstChild;
        }

    }

    if (message) {
        binder.meta.keys = Object.keys(await binder.compute() || {});
        length = binder.meta.keys.length;
    }

    if (binder.meta.length > length) {
        binder.meta.length--;
        const start = binder.meta.length * binder.meta.count;
        const stop = (start) + binder.meta.count;
        for (let i = start; i < stop; i++) {
            binder.meta.removes.push(binder.owner.children[ i ]);
        }
        // binder.meta.removes.push(binder.owner.children[ index ]);
        // binder.meta.removes.push(index);
    } else if (binder.meta.length < length) {

        const indexValue = binder.meta.length;
        const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;
        const variableValue = `${binder.meta.path}.${keyValue}`;

        const dynamics = {
            ...binder.dynamics,
            get [ binder.meta.keyName ] () { return keyValue; },
            get [ binder.meta.indexName ] () { return indexValue; },
            set [ binder.meta.variableName ] (value) {
                let data = binder.container.data;
                for (const part of binder.meta.pathParts) {
                    if (part in this) data = this[ part ];
                    else if (part in data) data = data[ part ];
                    else return;
                }
                data[ keyValue ] = value;
            },
            get [ binder.meta.variableName ] () {
                let data = binder.container.data;
                for (const part of binder.meta.pathParts) {
                    if (part in this) data = this[ part ];
                    else if (part in data) data = data[ part ];
                    else return;
                }
                return data[ keyValue ];
            }
        };

        const rewrites = [ ...(binder.rewrites || []) ];
        if (binder.meta.indexPattern) rewrites.unshift([ binder.meta.indexPattern, indexValue ]);
        if (binder.meta.keyPattern) rewrites.unshift([ binder.meta.keyPattern, keyValue ]);
        if (binder.meta.variablePattern) rewrites.unshift([ binder.meta.variablePattern, variableValue ]);

        // const clone = binder.meta.clone.cloneNode(true);
        // tick.then(binder.binder.add.bind(binder.binder, clone, binder.container, dynamics, rewrites));

        const clone = binder.meta.clone.content.cloneNode(true);

        let child = clone.firstChild;
        while (child) {
            binder.binder.add(child, binder.container, dynamics, rewrites);
            // tick.then(binder.binder.add.bind(binder.binder, child, binder.container, dynamics, rewrites));
            child = child.nextSibling;
        }

        binder.meta.appends.push(clone);
        binder.meta.length++;
    }

    if (binder.meta.length !== length) {
        binder.meta.busy = true;
        each(binder);
        return;
    }
    // if (binder.meta.length !== length) return;
    // if (binder.meta.busy) return;
    // else binder.meta.busy = true;

    // tick.then(() => {

    if (binder.meta.removes.length) {
        // console.log('removes');
        const removes = binder.meta.removes;
        binder.meta.removes = [];
        for (const remove of removes) {
            binder.owner.removeChild(remove);
            // binder.owner.removeChild(binder.owner.children[ remove ]);
            // binder.owner.children[ remove ].remove();
        }
    }

    if (binder.meta.appends.length) {
        // console.log('appeds');
        const appends = binder.meta.appends;
        binder.meta.appends = [];
        for (const append of appends) {
            binder.owner.appendChild(append);
        }
        // binder.owner.append(...appends);
    }

    // if (binder.owner.nodeName === 'SELECT') binder.owner.dispatchEvent(new Event('$renderEach'));

    binder.meta.busy = false;
    // });

};

export default each;

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

// let node = binder.owner.firstChild;
// while (node) {
//     binder.meta.clone.content.appendChild(node);
//     binder.meta.cloneLength++;
//     node = binder.owner.firstChild;
// }