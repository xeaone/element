
const setup = async function (binder) {
    const [ variable, index, key ] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();

    binder.meta.variable = variable;
    binder.meta.index = index;
    binder.meta.key = key;

    binder.meta.keys = binder.meta.keys || [];
    binder.meta.counts = [];
    binder.meta.setup = true;
    binder.meta.targetLength = 0;
    binder.meta.currentLength = 0;
    binder.meta.templateLength = 0;
    binder.meta.templateString = '';

    let node;
    while (node = binder.owner.firstChild) {
        if (node.nodeType === 1 || (node.nodeType === 3 && /\S/.test(node.nodeValue))) {
            binder.meta.templateString += node.outerHTML;
            binder.meta.templateLength++;
        }
        binder.owner.removeChild(node);
    }
};

const each = async function each (binder) {
    const { meta, owner } = binder;

    if (!meta.setup) {
        meta.setup = true;
        const [ variable, index, key ] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();

        meta.variable = variable;
        meta.index = index;
        meta.key = key;

        meta.keys = meta.keys || [];
        meta.counts = [];
        meta.setup = true;
        meta.targetLength = 0;
        meta.currentLength = 0;
        meta.templateLength = 0;
        meta.templateString = '';
        meta.templateText = '';
        meta.templateElement = document.createElement('template');

        let node;
        while (node = owner.firstChild) {
            if (node.nodeType === 1 || (node.nodeType === 3 && /\S/.test(node.nodeValue))) {
                meta.templateString += node.outerHTML;
                meta.templateLength++;
            }
            owner.removeChild(node);
        }
    }

    let data = await binder.compute();
    if (data instanceof Array) {
        meta.targetLength = data.length;
    } else {
        meta.keys = Object.keys(data || {});
        meta.targetLength = meta.keys.length;
    }

    if (meta.currentLength > meta.targetLength) {
        while (meta.currentLength > meta.targetLength) {
            let count = meta.templateLength;

            while (count--) {
                const node = owner.lastChild;
                owner.removeChild(node);
                binder.remove(node);
            }

            meta.currentLength--;
        }
    } else if (meta.currentLength < meta.targetLength) {

        while (meta.currentLength < meta.targetLength) {
            const index = meta.currentLength;
            const key = meta.keys[ index ] ?? index;
            const variable = `${binder.path}[${key}]`;

            const rKey = new RegExp(`\\b(${meta.key})\\b`, 'g');
            const rIndex = new RegExp(`\\b(${meta.index})\\b`, 'g');
            const rVariable = new RegExp(`\\b(${meta.variable})\\b`, 'g');
            const syntax = new RegExp(`{{.*?\\b(${meta.variable}|${meta.index}|${meta.key})\\b.*?}}`, 'g');

            let clone = meta.templateString;

            clone.match(syntax)?.forEach(match =>
                clone = clone.replace(match,
                    match.replace(rVariable, variable)
                        .replace(rIndex, index)
                        .replace(rKey, key)));

            meta.templateText += clone;
            meta.currentLength++;
        }

        if (meta.currentLength === meta.targetLength) {
            meta.templateElement.innerHTML = meta.templateText;
            meta.templateText = '';
            // binder.adds(meta.templateElement.content.childNodes, binder.container).then(() => {
            //     owner.appendChild(meta.templateElement.content);
            //     if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
            // });
            owner.appendChild(meta.templateElement.content);
        }

        // const template = document.createElement('template');
        // template.innerHTML = html;
        // binder.adds(template.content.childNodes, binder.container).then(() => {
        //     owner.appendChild(template.content);
        //     if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
        // });

    }

};

export default each;

// export default { setup, write };