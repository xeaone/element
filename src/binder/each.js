import Batcher from '../batcher.js';

export default function (binder) {
    const self = this;

    const render = {
        read () {
            this.data = binder.data || [];

            if (!binder.meta.setup) {
                binder.meta.keys = [];
                binder.meta.counts = [];
                binder.meta.setup = false;
                binder.meta.pending = false;
                binder.meta.targetLength = 0;
                binder.meta.currentLength = 0;
                binder.meta.parentContext = binder.context;
                binder.meta.template = document.createDocumentFragment();
                binder.meta.keyVariable = binder.target.getAttribute('o-key');
                binder.meta.indexVariable = binder.target.getAttribute('o-index');
                // binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);

                while (binder.target.firstChild) {
                    binder.meta.template.appendChild(binder.target.removeChild(binder.target.firstChild));
                }

                binder.meta.setup = true;
            }

            binder.meta.keys = Object.keys(this.data);
            binder.meta.targetLength = binder.meta.keys.length;

            if (binder.meta.currentLength === binder.meta.targetLength) {
                return false;
            }

        },
        write () {

            if (binder.meta.currentLength === binder.meta.targetLength) {
                binder.meta.pending = false;
                return;
            }

            if (binder.meta.currentLength > binder.meta.targetLength) {
                let count = binder.meta.counts.pop();

                while(count--) {
                    const node = binder.target.lastChild;
                    binder.target.removeChild(node);
                    self.remove(node);
                }

                binder.meta.currentLength--;
            } else if (binder.meta.currentLength < binder.meta.targetLength) {
                const fragment = binder.meta.template.cloneNode(true);
                const index = binder.meta.currentLength++;

                self.add(fragment, {
                    index: index,
                    path: binder.path,
                    variable: binder.names[1],
                    container: binder.container,
                    scope: binder.container.scope,
                    key: binder.meta.keys[index],
                    keyVariable: binder.meta.keyVariable,
                    parentContext: binder.meta.parentContext,
                    indexVariable: binder.meta.indexVariable
                });

                binder.meta.counts.push(fragment.childNodes.length);
                binder.target.appendChild(fragment);
            }

            if (binder.meta.pending && render.read) {
                return;
            } else {
                binder.meta.pending = true;
            }

            delete render.read;
            Batcher.batch(render);
        }
    };

    return render;
}
