
// const empty = /^\s*$/;
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

// const clean = function (node: Node) {
//     if (node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.TEXT_NODE && empty.test(node.nodeValue)) {
//         node.parentNode.removeChild(node);
//     } else {
//         let child = node.firstChild;
//         while (child) {
//             const next = child.nextSibling;
//             clean(child);
//             child = next;
//         }
//     }
// };

const walk = function (node: Node, handler: (node: Node, paths) => void, paths = []) {
    let i = 0;
    let child = node.firstChild;
    while (child) {
        if (child.nodeType === Node.TEXT_NODE) {
            const start = child.textContent.indexOf('{{');
            if (start === -1) return;

            if (start !== 0) child = (child as Text).splitText(start);

            const end = child.textContent.indexOf('}}');
            if (end === -1) return;

            if (end + 2 !== child.textContent.length) {
                (child as Text).splitText(end + 2);
            }
            const childPaths = [ ...paths, 'childNodes', i ];
            handler(child, childPaths);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childPaths = [ ...paths, i ];
            let each = false;

            const attributes = (child as Element).attributes;
            for (let ai = 0; ai < attributes.length; ai++) {
                const attribute = attributes[ ai ];
                if (attribute.name === 'each' || attribute.name === 'o-each') each = true;
                if (/{{.*?}}/.test(attribute.value)) handler(attribute, [ ...childPaths, 'attributes', ai ]);
            }

            if (each) return;

            walk(child, handler, childPaths);
        }
        child = child.nextSibling;
        i++;
    }
};

const setup = function (binder) {
    let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;
    binder.meta.pathParts = path.split('.');

    binder.meta.keys = [];
    binder.meta.setup = true;
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;

    binder.meta.clone = document.createElement('template');
    binder.meta.templateElement = document.createElement('template');

    // binder.meta.adds = [];
    // let i = 0;
    // let node = binder.owner.firstChild;
    // while (node) {
    //     walk(node, function (child, add) {
    //         binder.meta.adds.push(add);
    //     }, [ 'childNodes', i ]);
    //     binder.meta.clone.content.appendChild(node);
    //     binder.meta.cloneLength++;
    //     node = binder.owner.firstChild;
    //     i++;
    // }

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
                tick.then(binder.binder.remove.bind(binder, node));
            }

            binder.meta.currentLength--;
        }

    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {
            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;

            const dynamics = {
                ...binder.dynamics,
                // [ binder.meta.keyName ]: keyValue,
                // [ binder.meta.indexName ]: indexValue,
                // get [ binder.meta.variableName ] () {
                //     let data = binder.container.data;
                //     for (const part of binder.meta.pathParts) {
                //         if (part in this) {
                //             data = this[ part ];
                //         } else if (part in data) {
                //             data = data[ part ];
                //         }
                //     }
                //     return data[ keyValue ];
                // }
            };
            dynamics[ binder.meta.keyName ] = keyValue;
            dynamics[ binder.meta.indexName ] = indexValue;
            Object.defineProperty(dynamics, binder.meta.variableName, {
                get () {
                    let data = binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in this) {
                            data = this[ part ];
                        } else if (part in data) {
                            data = data[ part ];
                        }
                    }
                    return data[ keyValue ];
                }
            });

            binder.meta.currentLength++;

            const clone = binder.meta.clone.content.cloneNode(true);

            // for (const parts of binder.meta.adds) {
            //     let node = clone;
            //     for (const part of parts) node = node[ part ];
            //     tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics));
            // }

            let node = clone.firstChild;
            while (node) {
                tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics));
                node = node.nextSibling;
            }

            binder.meta.templateElement.content.appendChild(clone);
        }

    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        // console.timeEnd(time);
        binder.owner.appendChild(binder.meta.templateElement.content);
        if (binder.owner.nodeName === 'SELECT') binder.owner.dispatchEvent(new Event('$renderEach'));
    }

};

export default each;