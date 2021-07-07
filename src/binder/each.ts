
const empty = /^\s*$/;
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

const tick = Promise.resolve();

const clean = function (node: Node) {
    if (node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.TEXT_NODE && empty.test(node.nodeValue)) {
        node.parentNode.removeChild(node);
    } else {
        let child = node.firstChild;
        while (child) {
            const next = child.nextSibling;
            clean(child);
            child = next;
        }
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

    let node = binder.owner.firstChild;
    while (node) {
        if (node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.TEXT_NODE && empty.test(node.nodeValue)) {
            const next = node.nextSibling;
            binder.owner.removeChild(node);
            node = next;
        } else {
            clean(node);
            binder.meta.clone.content.appendChild(node);
            binder.meta.cloneLength++;
            node = node.nextSibling;
        }
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
                [ binder.meta.keyName ]: keyValue,
                [ binder.meta.indexName ]: indexValue,
                get [ binder.meta.variableName ] () {
                    let data = binder.container.data;
                    for (const part of binder.meta.pathParts) {
                        if (part in this) {
                            data = this[ part ];
                        } else if (part in data) {
                            data = data[ part ];
                        }
                    }
                    return data[ keyValue ];
                },
            };

            binder.meta.currentLength++;

            const clone = binder.meta.clone.content.cloneNode(true);
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