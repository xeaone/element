import Binder from '../binder';

export default function (binder) {

    if (binder.meta.busy) {
        console.log('busy each');
        return;
    } else {
        binder.meta.busy = true;
    }

    const read = function () {

        if (!binder.meta.setup) {
            binder.meta.keys = [];
            binder.meta.counts = [];
            binder.meta.busy = false;
            binder.meta.setup = false;
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

        binder.meta.keys = Object.keys(binder.data || []);
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
                    Promise.resolve().then(Binder.remove.bind(Binder, node));
                    binder.target.removeChild(node);
                }

                binder.meta.currentLength--;
            }
        } else if (binder.meta.currentLength < binder.meta.targetLength) {
            while (binder.meta.currentLength < binder.meta.targetLength) {
                const index = binder.meta.currentLength;
                const key = binder.meta.keys[index];
                const variable = `${binder.path}.${key}`;

                let clone = binder.meta.templateString;
                const length = binder.names.length > 4 ? 4 : binder.names.length;
                for (let i = 1; i < length; i++) {
                    const item = new RegExp(`\\b(${binder.names[i]})\\b`, 'g');
                    const syntax = new RegExp(`{{.*?\\b(${binder.names[i]})\\b.*?}}`, 'g');
                    let replace;
                    switch (i) {
                        case 1: replace = variable; break;
                        case 2: replace = index; break;
                        case 3: replace = key; break;
                    }
                    clone.match(syntax)?.forEach(match => clone = clone.replace(match, match.replace(item, replace)));
                }

                const parsed = new DOMParser().parseFromString(clone, 'text/html').body;

                let node;
                while (node = parsed.firstChild) {
                    binder.target.appendChild(node);
                    Promise.resolve().then(Binder.add.bind(Binder, node, binder.container));
                    // binder.meta.fragment.appendChild(node);
                    // Promise.resolve().then(Binder.add(node, binder.container)).catch(console.error);
                }

                binder.meta.currentLength++;
            }
            // binder.target.appendChild(binder.meta.fragment);
        }

        binder.meta.busy = false;
    };

    return { read, write };
}
