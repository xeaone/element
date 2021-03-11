import Binder from '../binder';

const variablePattern = /\s*\{\{\s*(.*?)\s+.*/;

export default function (binder) {
    let data;
    return {
        async read() {
            data = binder.data;

            if (!binder.meta.setup) {
                binder.meta.keys = [];
                binder.meta.counts = [];
                binder.meta.setup = true;
                binder.meta.targetLength = 0;
                binder.meta.currentLength = 0;
                binder.meta.templateString = binder.target.innerHTML;
                binder.meta.templateLength = binder.target.childNodes.length;
                binder.meta.variable = binder.value.replace(variablePattern, '$1');

                while (binder.target.firstChild) {
                    binder.target.removeChild(binder.target.firstChild);
                }

            }

            if (data instanceof Array) {
                binder.meta.targetLength = data.length;
            } else {
                binder.meta.keys = Object.keys(data || {});
                binder.meta.targetLength = binder.meta.keys.length;
            }

            // binder.meta.currentLength = binder.target.children.length / binder.meta.templateLength;
        },
        async write() {
            // const tasks = [];

            if (binder.meta.currentLength > binder.meta.targetLength) {
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;

                    while (count--) {
                        const node = binder.target.lastChild;
                        // tasks.push(async function (node) {
                        //     binder.target.removeChild(node);
                        //     return Binder.remove(node);
                        // }.call(this, node));
                        Promise.resolve().then(() => binder.target.removeChild(node)).then(() => Binder.remove(node));
                    }

                    binder.meta.currentLength--;
                }
            } else if (binder.meta.currentLength < binder.meta.targetLength) {
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const index = binder.meta.currentLength;
                    const key = binder.meta.keys[index] ?? index;
                    console.log(key);
                    const variable = `${binder.path}.${key}`;

                    let clone = binder.meta.templateString;
                    // const length = binder.names.length > 4 ? 4 : binder.names.length;
                    // for (let i = 1; i < length; i++) {
                    // const item = new RegExp(`\\b(${binder.names[i]})\\b`, 'g');
                    // const syntax = new RegExp(`{{.*?\\b(${binder.names[i]})\\b.*?}}`, 'g');
                    const item = new RegExp(`\\b(${binder.meta.variable})\\b`, 'g');
                    const syntax = new RegExp(`{{.*?\\b(${binder.meta.variable})\\b.*?}}`, 'g');
                    let replace = variable;
                    // let replace;
                    // switch (i) {
                    //     case 1: replace = variable; break;
                    //     case 2: replace = index; break;
                    //     case 3: replace = key; break;
                    // }
                    clone.match(syntax)?.forEach(match => clone = clone.replace(match, match.replace(item, replace)));

                    // }

                    const parsed = new DOMParser().parseFromString(clone, 'text/html').body;

                    for (const node of parsed.childNodes) {
                        Promise.resolve().then(() => Binder.add(node, binder.container)).then(() => binder.target.appendChild(node));
                        // tasks.push(async function (node) {
                        //     await Binder.add(node, binder.container);
                        //     binder.target.appendChild(node);
                        // }.call(this, node));
                    }

                    binder.meta.currentLength++;
                }

                // return Promise.all(tasks);
                // binder.target.appendChild(binder.meta.fragment);
            }

        }
    };
}
