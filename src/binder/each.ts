import Binder from '../binder';

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
        // binder.meta.templateString = binder.target.innerHTML;
        // binder.meta.templateLength = binder.target.childNodes.length;
        // binder.meta.variable = binder.value.replace(variablePattern, '$1');

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
        binder.busy = true;
    },
    async write (binder) {

        let data = binder.data;
        if (data instanceof Array) {
            binder.meta.targetLength = data.length;
        } else {
            binder.meta.keys = Object.keys(data || {});
            binder.meta.targetLength = binder.meta.keys.length;
        }

        if (binder.meta.currentLength > binder.meta.targetLength) {
            const tasks = [];
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength;

                while (count--) {
                    const node = binder.target.lastChild;
                    binder.target.removeChild(node);
                    tasks.push(Binder.remove(node));
                }

                binder.meta.currentLength--;
            }
            await Promise.all(tasks);
        } else if (binder.meta.currentLength < binder.meta.targetLength) {
            console.time(`each ${binder.meta.targetLength}`);

            // const tasks = [];
            // const template = document.createElement('template');

            let html = '';
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const index = binder.meta.currentLength;
                const key = binder.meta.keys[ index ] ?? index;
                const variable = `${binder.path}.${key}`;

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

                // const item = document.createElement('template');
                // item.innerHTML = clone;
                // tasks.push(Binder.add(item, binder.container));

                binder.meta.currentLength++;
            }

            const template = document.createElement('template');
            template.innerHTML = html;

            // template.content.childNodes.forEach(node => Binder.add(node, binder.container));
            // binder.target.appendChild(template.content);

            const tasks = [];
            template.content.childNodes.forEach(node => tasks.push(Binder.add(node, binder.container)));
            await Promise.all(tasks);

            binder.target.appendChild(template.content);
            console.timeEnd(`each ${binder.meta.targetLength}`);
        }

    },
    async after (binder) {
        binder.busy = false;
    }
};
