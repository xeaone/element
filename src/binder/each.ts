import Batcher from "../batcher";

export default {
    async setup (binder) {
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
        // binder.meta.content = document.createElement('template').content;

        let node;
        while (node = binder.target.firstChild) {
            if (node.nodeType === 1 || (node.nodeType === 3 && /\S/.test(node.nodeValue))) {
                binder.meta.templateString += node.outerHTML;
                binder.meta.templateLength++;
            }
            binder.target.removeChild(node);
        }
    },
    async write (binder) {
        const { meta, target } = binder;

        let data = await binder.compute();
        if (data instanceof Array) {
            meta.targetLength = data.length;
        } else {
            meta.keys = Object.keys(data || {});
            meta.targetLength = meta.keys.length;
        }

        const label = `each: id=${target.id} targetLength=${meta.targetLength}`;
        console.time(label);

        // binder.busy = false;

        if (meta.currentLength > meta.targetLength) {
            while (meta.currentLength > meta.targetLength) {
                let count = meta.templateLength;

                while (count--) {
                    const node = target.lastChild;
                    target.removeChild(node);
                    binder.remove(node);
                }

                meta.currentLength--;
            }
        } else if (meta.currentLength < meta.targetLength) {

            let html = '';
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

                html += clone;

                meta.currentLength++;
            }

            const template = document.createElement('template');
            template.innerHTML = html;

            const batcher = new Batcher();
            await Promise.all(Array.prototype.map.call(template.content.childNodes, async node =>
                binder.add(node, binder.container, batcher))).then(() =>
                    target.appendChild(template.content));

        }
        console.timeEnd(label);

    }
};
