import Binder from '../binder.js';

export default function (binder) {

    if (binder.meta.busy) {
        console.log('busy each');
        return;
    } else binder.meta.busy = true;

    let data;

    const read = function () {
        data = binder.data || [];

        if (!binder.meta.setup) {
            binder.meta.keys = [];
            binder.meta.counts = [];
            binder.meta.setup = false;
            binder.meta.busy = false;
            binder.meta.targetLength = 0;
            binder.meta.currentLength = 0;
            binder.meta.templateString = binder.target.innerHTML;
            // binder.meta.fragment = document.createDocumentFragment();
            binder.meta.templateLength = binder.target.childNodes.length;

            while (binder.target.firstChild) {
                binder.target.removeChild(binder.target.firstChild);
            }

            binder.meta.setup = true;
        }

        binder.meta.keys = data ? Object.keys(data) : [];
        binder.meta.targetLength = binder.meta.keys.length;

        if (binder.meta.currentLength === binder.meta.targetLength) {
            binder.meta.busy = false;
            this.write = false;
        }

    };

    const write = function () {

        if (binder.meta.currentLength > binder.meta.targetLength) {
            while (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.templateLength;

                while (count--) {
                    const node = binder.target.lastChild;
                    Promise.resolve().then(Binder.remove(node));
                    binder.target.removeChild(node);
                }

                binder.meta.currentLength--;
            }
        } else if (binder.meta.currentLength < binder.meta.targetLength) {
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const index = binder.meta.currentLength;
                const key = binder.meta.keys[index];

                const variablePattern = new RegExp(`\\[${binder.names[1]}\\]`, 'g');
                const indexPattern = new RegExp(`({{)?\\[${binder.names[2]}\\](}})?`, 'g');
                const keyPattern = new RegExp(`({{)?\\[${binder.names[3]}\\](}})?`, 'g');

                const clone = binder.meta.templateString
                    .replace(variablePattern, `${binder.path}.${key}`)
                    .replace(indexPattern, index)
                    .replace(keyPattern, key);

                const parsed = new DOMParser().parseFromString(clone, 'text/html').body;

                let node;
                while (node = parsed.firstChild) {
                    binder.target.appendChild(node);
                    Promise.resolve().then(Binder.add(node, binder.container, binder.scope));
                    // binder.meta.fragment.appendChild(node);
                    // Promise.resolve().then(Binder.add(node, binder.container, binder.scope)).catch(console.error);
                }

                binder.meta.currentLength++;
            }
            // binder.target.appendChild(binder.meta.fragment);
        }

        binder.meta.busy = false;
    };

    return { read, write };
}
