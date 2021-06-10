
export default {
    async setup (binder) {
        console.log('each: setup');

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
        while (node = binder.target.firstChild) {
            if (node.nodeType === 1 || (node.nodeType === 3 && /\S/.test(node.nodeValue))) {
                binder.meta.templateString += node.outerHTML;
                binder.meta.templateLength++;
            }
            binder.target.removeChild(node);
        }
    },
    async before (binder) {
        console.log('each: before');
        binder.busy = true;
    },
    async write (binder) {
        console.log('each (start): write');

        // let data = binder.data;
        let data = await binder.compute();
        if (data instanceof Array) {
            binder.meta.targetLength = data.length;
        } else {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }

        binder.busy = false;

        if (binder.meta.currentLength > binder.meta.targetLength) {
            const tasks = [];
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength;

                while (count--) {
                    const node = binder.target.lastChild;
                    binder.target.removeChild(node);
                    tasks.push(binder.remove(node));
                }

                binder.meta.currentLength--;
            }
            await Promise.all(tasks);
        } else if (binder.meta.currentLength < binder.meta.targetLength) {
            console.time(`each ${binder.meta.targetLength}`);

            let html = '';
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const index = binder.meta.currentLength;
                const key = binder.meta.keys[ index ] ?? index;
                const variable = `${binder.path}[${key}]`;
                // const variable = `${binder.path}.${key}`;

                const rKey = new RegExp(`\\b(${binder.meta.key})\\b`, 'g');
                const rIndex = new RegExp(`\\b(${binder.meta.index})\\b`, 'g');
                const rVariable = new RegExp(`\\b(${binder.meta.variable})\\b`, 'g');
                const syntax = new RegExp(`{{.*?\\b(${binder.meta.variable}|${binder.meta.index}|${binder.meta.key})\\b.*?}}`, 'g');

                let clone = binder.meta.templateString;

                clone.match(syntax)?.forEach(match =>
                    clone = clone.replace(match,
                        match.replace(rVariable, variable)
                            .replace(rIndex, index)
                            .replace(rKey, key)));

                html += clone;

                binder.meta.currentLength++;
            }

            const template = document.createElement('template');
            template.innerHTML = html;

            // const adopted = document.adoptNode(template.content);

            console.log(template);
            await Promise.all(Array.prototype.map.call(template.content.childNodes, node => binder.add(node, binder.container)));
            console.log('each (end): write');

            binder.target.appendChild(template.content);
            console.timeEnd(`each ${binder.meta.targetLength}`);
        }

    },
    // async after (binder) {
    //     binder.busy = false;
    // }
};
