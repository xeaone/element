import format from './format';
import booleans from './boolean';

export default {

    render (binder:any) {
        const boolean = booleans.includes(binder.name);
        const node = binder.node as Attr;

        node.value = '';

        if (boolean) {
            const data = binder.compute() ? true : false;
            if (data) binder.owner?.setAttributeNode(node);
            else binder.owner?.removeAttribute(binder.name);
        } else {
            const data = format(binder.compute());
            (binder.owner as any)[ binder.name ] = data;
            binder.owner?.setAttribute(binder.name, data);
        }

    },

    reset (binder:any) {
        const boolean = booleans.includes(binder.name);

        if (boolean) {
            binder.owner?.removeAttribute(binder.name);
        } else {
            (binder.owner as any)[ binder.name ] = undefined;
            binder.owner?.setAttribute(binder.name, '');
        }

    }

};

