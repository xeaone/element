import Binder from './binder.ts';
import format from './format.ts';
import booleans from './boolean.ts';

export default class Standard extends Binder {

    render () {
        const boolean = booleans.includes(this.name);
        const node = this.node as Attr;

        node.value = '';

        if (boolean) {
            const data = this.compute() ? true : false;
            if (data) this.owner?.setAttributeNode(node);
            else this.owner?.removeAttribute(this.name);
        } else {
            const data = format(this.compute());
            (this.owner as any)[ this.name ] = data;
            this.owner?.setAttribute(this.name, data);
        }

    }

    reset () {
        const boolean = booleans.includes(this.name);

        if (boolean) {
            this.owner?.removeAttribute(this.name);
        } else {
            (this.owner as any)[ this.name ] = undefined;
            this.owner?.setAttribute(this.name, '');
        }

    }

}

