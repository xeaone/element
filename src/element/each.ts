import Binder from './binder.ts';

const whitespace = /\s+/;

export default class Each extends Binder {

    reset () {
        const owner = (this.node as Attr).ownerElement;
        this.meta.targetLength = 0;
        this.meta.currentLength = 0;
        while (owner && owner.lastChild) this.release(owner.removeChild(owner.lastChild));
        while (this.meta.queueElement.content.lastChild) this.meta.queueElement.content.removeChild(this.meta.queueElement.content.lastChild);
    }

    render () {
        const [ data, variable, key, index ] = this.compute();
        const [ reference ] = this.references;
        const owner = (this.node as Attr).ownerElement as Element;

        this.meta.data = data;
        this.meta.keyName = key;
        this.meta.indexName = index;

        this.meta.variable = variable;
        this.meta.reference = reference;

        if (!this.meta.setup) {
            this.node.nodeValue = '';

            this.meta.keys = [];
            this.meta.setup = true;
            this.meta.targetLength = 0;
            this.meta.currentLength = 0;
            this.meta.templateLength = 0;
            this.meta.queueElement = document.createElement('template');
            this.meta.templateElement = document.createElement('template');

            let node = owner.firstChild;
            while (node) {
                if (node.nodeType === Node.TEXT_NODE && whitespace.test(node.nodeValue as string)) {
                    owner.removeChild(node);
                } else {
                    this.meta.templateLength++;
                    this.meta.templateElement.content.appendChild(node);
                }
                node = owner.firstChild;
            }

        }

        if (data?.constructor === Array) {
            this.meta.targetLength = data.length;
        } else {
            this.meta.keys = Object.keys(data || {});
            this.meta.targetLength = this.meta.keys.length;
        }

        // console.time('each');
        if (this.meta.currentLength > this.meta.targetLength) {
            while (this.meta.currentLength > this.meta.targetLength) {
                let count = this.meta.templateLength;

                while (count--) {
                    const node = owner.lastChild;
                    if (node) {
                        owner.removeChild(node);
                        this.release(node);
                    }
                }

                this.meta.currentLength--;
            }
        } else if (this.meta.currentLength < this.meta.targetLength) {
            while (this.meta.currentLength < this.meta.targetLength) {
                const keyValue = this.meta.keys[ this.meta.currentLength ] ?? this.meta.currentLength;
                const indexValue = this.meta.currentLength++;

                const clone = this.meta.templateElement.content.cloneNode(true);

                const rewrites = [
                    ...this.rewrites,
                    [ this.meta.variable, `${this.meta.reference}.${keyValue}` ]
                ];

                const instance = {
                    ...this.instance,
                    [ this.meta.keyName ]: keyValue,
                    [ this.meta.indexName ]: indexValue,
                    get [ this.meta.variable ] () {
                        return data[ keyValue ];
                    }
                };
                // const instance = Object.create(this.instance, {
                //     [ this.meta.keyName ]: { value: keyValue },
                //     [ this.meta.indexName ]: { value: indexValue },
                //     [ this.meta.variable ]: { get () { return data[ keyValue ]; } },
                // });

                let node = clone.firstChild, child;
                while (node) {
                    child = node;
                    node = node.nextSibling;
                    this.register(child, this.context, instance, rewrites);
                }

                this.meta.queueElement.content.appendChild(clone);
            }
        }
        // console.timeEnd('each');

        if (this.meta.currentLength === this.meta.targetLength) {
            owner.appendChild(this.meta.queueElement.content);
        }

    }

}