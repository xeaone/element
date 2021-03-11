import Binder from '../binder';

const variablePattern = /\s*\{\{\s*(.*?)\s+.*/;

export default function (binder) {
    return {
        read() {

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

            binder.meta.keys = Object.keys(binder.data || []);
            binder.meta.targetLength = binder.meta.keys.length;
            binder.meta.currentLength = binder.target.children.length / binder.meta.templateLength;

            // if (binder.meta.currentLength === binder.meta.targetLength) {
            //     binder.busy = false;
            //     this.write = false;
            // } else {
            // binder.busy = true;
            // }

            // binder.busy = true;
        },
        write() {

            if (binder.meta.currentLength > binder.meta.targetLength) {
                while (binder.meta.currentLength > binder.meta.targetLength) {
                    let count = binder.meta.templateLength;

                    while (count--) {
                        const node = binder.target.lastChild;
                        Binder.remove(node);
                        // Promise.resolve().then(Binder.remove.bind(Binder, node));
                        binder.target.removeChild(node);
                    }

                    // binder.meta.currentLength--;
                }
            } else if (binder.meta.currentLength < binder.meta.targetLength) {
                // setTimeout(() => {
                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const index = binder.meta.currentLength;
                    const key = binder.meta.keys[index];
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

                    let node;
                    while (node = parsed.firstChild) {
                        // tasks.push(Binder.add(node, binder.container));

                        binder.target.appendChild(node);
                        Binder.add(node, binder.container);

                        // Binder.add(node, binder.container).then(binder.target.appendChild.bind(binder.target, node));

                        // setTimeout(Binder.add.bind(Binder, node, binder.container))
                        // Promise.resolve().then(Binder.add.bind(Binder, node, binder.container));
                        // binder.meta.fragment.appendChild(node);
                        // Promise.resolve().then(Binder.add(node, binder.container)).catch(console.error);
                    }

                    // binder.meta.currentLength++;
                }
                // });
                // binder.target.appendChild(binder.meta.fragment);
            }

        }
    };
}
