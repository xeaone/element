import Batcher from '../batcher.js';

export default function (binder) {
    const self = this;

    if (binder.meta.pending) return;
    else binder.meta.pending = true;

    return {
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
                binder.meta.fragment = document.createDocumentFragment();
                binder.meta.template = document.createDocumentFragment();
                binder.meta.keyVariable = binder.target.getAttribute('o-key');
                binder.meta.indexVariable = binder.target.getAttribute('o-index');

                while (binder.target.firstChild) {
                    binder.meta.template.appendChild(binder.target.removeChild(binder.target.firstChild));
                }

                binder.meta.templateLength = binder.meta.template.childNodes.length;
                binder.meta.setup = true;
            }

            binder.meta.keys = Object.keys(this.data);
            binder.meta.targetLength = binder.meta.keys.length;

            if (binder.meta.currentLength === binder.meta.targetLength) {
                binder.meta.pending = false;
                this.write = false;
            }

        },
        write () {

            if (binder.meta.currentLength === binder.meta.targetLength) {
                binder.meta.pending = false;
                return;
            }
            
            if (binder.meta.currentLength > binder.meta.targetLength) {

                while (binder.meta.currentLength > binder.meta.targetLength) {

                    // might need count after Binder.add
                    let count = binder.meta.templateLength;
                    
                    while(count--) {
                        const node = binder.target.lastChild;
                        binder.target.removeChild(node);
                        Promise.resolve().then(function (n) {
                            return self.remove(n);
                        }.bind(null, node)).catch(console.error);
                    }

                    binder.meta.currentLength--;
                }

            } else if (binder.meta.currentLength < binder.meta.targetLength) {

                while (binder.meta.currentLength < binder.meta.targetLength) {
                    const clone = binder.meta.template.cloneNode(true);
                    const index = binder.meta.currentLength;
                    
                    let node;
                    while (node = clone.firstChild) {

                        Promise.resolve().then(function (n) {
                            self.add(n, {
                                index: index,
                                path: binder.path,
                                variable: binder.names[1],
                                container: binder.container,
                                scope: binder.container.scope,
                                key: binder.meta.keys[index],
                                keyVariable: binder.meta.keyVariable,
                                parentContext: binder.meta.parentContext,
                                indexVariable: binder.meta.indexVariable,
                                templateLength: binder.meta.templateLength,
                            });
                        }.bind(null, node)).catch(console.error);

                        binder.meta.fragment.appendChild(node);
                    }
                    
                    binder.meta.currentLength++;
                }

                binder.target.appendChild(binder.meta.fragment);
            }

            // if (binder.meta.pending && render.read) {
            //     binder.meta.pending = false;
            //     return;
            // } else {
            //     binder.meta.pending = true;
            // }
            // delete render.read;
            // render.context = render.context || { read: false };
            
            binder.meta.pending = false;
            // Batcher.batch(render);
        }
    };
}