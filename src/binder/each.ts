
const empty = /\s+|(\\t)+|(\\r)+|(\\n)+|^$/;

const clean = function (node) {

    for (const child of node.childNodes) {
        clean(child);
    }

    if (node.nodeType === 8 || node.nodeType === 3 && empty.test(node.nodeValue)) {
        node.parentNode.removeChild(node);
        return false;
    } else {
        return true;
    }

};

const setup = function (binder) {
    const { meta, owner } = binder;

    const [ variable, index, key ] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();

    meta.keyName = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
    meta.indexName = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
    meta.variableName = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;

    meta.keys = [];
    meta.setup = true;
    meta.targetLength = 0;
    meta.currentLength = 0;
    meta.templateLength = 0;

    meta.clone = document.createElement('template');
    meta.templateElement = document.createElement('template');

    let node;
    while (node = owner.firstChild) {
        if (clean(node)) {
            meta.templateLength++;
            meta.clone.content.appendChild(node);
        }
    }
};

const each = async function each (binder) {
    const { meta, owner } = binder;

    if (!meta.setup) await setup(binder);

    let data = await binder.compute();
    // console.log('each', data.length, meta.targetLength);
    if (data instanceof Array) {
        meta.targetLength = data.length;
    } else {
        meta.keys = Object.keys(data || {});
        meta.targetLength = meta.keys.length;
    }

    if (meta.currentLength > meta.targetLength) {
        const tasks = [];
        while (meta.currentLength > meta.targetLength) {
            let count = meta.templateLength;

            while (count--) {
                const node = owner.lastChild;
                owner.removeChild(node);
                tasks.push(binder.remove(node));
            }

            meta.currentLength--;
        }

        if (meta.currentLength === meta.targetLength) {
            Promise.all(tasks).then(function eachFinish () {
                owner.appendChild(meta.templateElement.content);
                if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
            });
        }

    } else if (meta.currentLength < meta.targetLength) {
        const tasks = [];
        while (meta.currentLength < meta.targetLength) {
            const indexValue = meta.currentLength;
            const keyValue = meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.path}[${keyValue}]`;
            const keyName = meta.keyName;
            const indexName = meta.indexName;
            const variableName = meta.variableName;

            meta.currentLength++;
            const extra = { keyName, indexName, variableName, indexValue, keyValue, variableValue };

            const clone = meta.clone.content.cloneNode(true);
            // binder.adds(clone.childNodes, binder.container, extra);
            // tasks.push(binder.adds(clone.childNodes, binder.container, extra));
            tasks.push(binder.adds(clone, binder.container, extra));
            meta.templateElement.content.appendChild(clone);
        }

        if (meta.currentLength === meta.targetLength) {
            Promise.all(tasks).then(function eachFinish () {
                owner.appendChild(meta.templateElement.content);
                if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
            });
        }


    }

};

export default each;

// export default { setup, write };