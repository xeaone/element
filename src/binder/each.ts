import Binder from '../binder';

// const variablePattern = /\s*\{\{\s*(.*?)\s+.*/;

export default function (binder) {
    let data;
    return {
        async read () {
            data = binder.data;

            if (!binder.meta.setup) {
                const [ variable, index, key ] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();

                binder.meta.variable = variable;
                binder.meta.index = index;
                binder.meta.key = key;

                binder.meta.keys = [];
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

            }

            if (data instanceof Array) {
                binder.meta.targetLength = data.length;
            } else {
                binder.meta.keys = Object.keys(data || {});
                binder.meta.targetLength = binder.meta.keys.length;
            }

        },
        async write () {

            if (binder.meta.currentLength > binder.meta.targetLength) {
                const nodes = [];
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;

                    while (count--) {
                        const node = binder.target.lastChild;
                        binder.target.removeChild(node);
                        nodes.push(node);
                        // Binder.remove(node);
                    }

                    binder.meta.currentLength--;
                }
                nodes.forEach(node => Binder.remove(node));
            } else if (binder.meta.currentLength < binder.meta.targetLength) {
                let html = '';
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const index = binder.meta.currentLength;
                    const key = binder.meta.keys[ index ] ?? index;
                    const variable = `${binder.path}.${key}`;

                    let clone = binder.meta.templateString;

                    const rKey = new RegExp(`\\b(${binder.meta.key})\\b`, 'g');
                    const rIndex = new RegExp(`\\b(${binder.meta.index})\\b`, 'g');
                    const rVariable = new RegExp(`\\b(${binder.meta.variable})\\b`, 'g');
                    const syntax = new RegExp(`{{.*?\\b(${binder.meta.variable}|${binder.meta.index}|${binder.meta.key})\\b.*?}}`, 'g');

                    clone.match(syntax)?.forEach(match =>
                        clone = clone.replace(match,
                            match.replace(rVariable, variable)
                                .replace(rIndex, index)
                                .replace(rKey, key)));

                    html += clone;

                    // const template = document.createElement('template');
                    // template.innerHTML = clone;
                    // for (const node of template.content.childNodes) {
                    //     Binder.add(node, binder.container);
                    //     binder.target.appendChild(node);
                    // }

                    binder.meta.currentLength++;
                }

                const template = document.createElement('template');
                template.innerHTML = html;
                for (const node of template.content.childNodes) {
                    Binder.add(node, binder.container);
                }
                binder.target.appendChild(template.content);

            }

        }
    };
}
