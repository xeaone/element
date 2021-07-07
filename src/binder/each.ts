
const empty = /^\s*$/;
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

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

    if (binder.extra) {
        // if (binder.extra.keyName)
        //     path = path.replace(binder.extra.keyPattern, (s, g1, g2, g3) => g1 + binder.extra.keyValue + g3);
        // if (binder.extra.indexName)
        //     path = path.replace(binder.extra.indexPattern, (s, g1, g2, g3) => g1 + binder.extra.indexValue + g3);
        if (binder.extra.variableName) {
            path = path.replace(new RegExp(`(.*?)(.*?\\b)(${binder.extra.variableName})(\\b.*?)(.*?)`), (s, g1, g2, g3, g4, g5) => g1 + g2 + binder.extra.variableValue + g4 + g5);
        }
        // make sure this works with parent context
    }

    binder.meta.path = path;
    binder.meta.keyName = key;
    binder.meta.indexName = index;
    binder.meta.variableName = variable;
    binder.meta.keyPattern = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
    binder.meta.indexPattern = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
    binder.meta.variablePattern = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;

    binder.meta.keys = [];
    binder.meta.tasks = [];
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
                binder.meta.tasks.push(binder.remove(node));
            }

            binder.meta.currentLength--;
        }

    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {
            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.meta.path}[${keyValue}]`;
            const extra = {
                keyValue, indexValue, variableValue,
                keyName: binder.meta.keyName,
                indexName: binder.meta.indexName,
                variableName: binder.meta.variableName,
                keyPattern: binder.meta.keyPattern,
                indexPattern: binder.meta.indexPattern,
                variablePattern: binder.meta.variablePattern,
            };

            binder.meta.currentLength++;

            const clone = binder.meta.clone.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                binder.meta.tasks.push(binder.add(node, binder.container, extra));
                // binder.meta.tasks.push(binder.binder.add(node, binder.container, extra));
                node = node.nextSibling;
            }
            binder.meta.templateElement.content.appendChild(clone);

            // let clone = binder.meta.clone.content.firstChild;
            // while (clone) {
            //     const node = clone.cloneNode(true);
            //     binder.meta.tasks.push(binder.add(node, binder.container, extra));
            //     binder.meta.templateElement.content.appendChild(node);
            //     clone = clone.nextSibling;
            // }

        }

    }

    if (binder.meta.currentLength === binder.meta.targetLength) {
        // console.timeEnd(time);
        Promise.all(binder.meta.tasks).then(function eachFinish () {
            binder.owner.appendChild(binder.meta.templateElement.content);
            if (binder.owner.nodeName === 'SELECT') binder.owner.dispatchEvent(new Event('$render'));
        });
    }

};

export default each;