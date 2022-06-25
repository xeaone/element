import Binder from './binder.ts';

const whitespace = /\s+/;

const eachHas = function (variable: string, indexName: string, keyName: string, target: any, key: any) {
    return key === variable ||
        key === `$$${variable}` ||
        key === indexName ||
        key === keyName ||
        key === '$index' ||
        key === '$item' ||
        key === '$key' ||
        Reflect.has(target, key);
};

const eachSet = function (
    reference: string, variable: string,
    indexName: string, keyName: string, keyValue: number | string,
    target: any, key: any, value: any) {
    if (key === variable || key === '$item') {
        return Reflect.set(Reflect.get(target, reference), keyValue, value);
    } else if (key === indexName || key === keyName) {
        return true;
    }
    return Reflect.set(target, key, value);
};

const eachGet = function (
    reference: string, variable: string,
    indexName: string, indexValue: number,
    keyName: string, keyValue: number | string,
    target: any, key: any) {

    if (key === `$$${variable}`) {
        return [ reference, keyValue ];
    } else if (key === variable || key === '$item') {
        // return binder.meta.data[ keyValue ];
        return Reflect.get(Reflect.get(target, reference), keyValue);
    } else if (key === indexName || key === '$index') {
        return indexValue;
    } else if (key === keyName || key === '$key') {
        console.log(key, keyValue);
        return keyValue;
    } else {
        return Reflect.get(target, key);
    }
};

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
                if (node.nodeType === 3 && whitespace.test(node.nodeValue as string)) {
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

        console.time('each');
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

                const context = new Proxy(this.context, {
                    has: eachHas.bind(null, this.meta.variable, this.meta.indexName, this.meta.keyName),
                    set: eachSet.bind(null, this.meta.reference, this.meta.variable, this.meta.indexName, this.meta.keyName, keyValue),
                    get: eachGet.bind(null, this.meta.reference, this.meta.variable, this.meta.indexName, indexValue, this.meta.keyName, keyValue)
                });

                const clone = this.meta.templateElement.content.cloneNode(true);

                let node = clone.firstChild, child;
                while (node) {
                    child = node;
                    node = node.nextSibling;
                    this.register(child, context);
                }

                this.meta.queueElement.content.appendChild(clone);
            }
        }
        console.timeEnd('each');

        if (this.meta.currentLength === this.meta.targetLength) {
            owner.appendChild(this.meta.queueElement.content);
        }

    }

}