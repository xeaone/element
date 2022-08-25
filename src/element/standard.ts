import format from './format';
import booleans from './boolean';

export default {

    setup (binder: any) {
        binder.node.value = '';
        binder.meta.boolean = booleans.includes(binder.name);
    },

    render (binder: any) {

        if (binder.meta.boolean) {
            const data = binder.compute() ? true : false;
            if (data) binder.owner.setAttributeNode(binder.node);
            else binder.owner.removeAttribute(binder.name);
        } else {
            const data = format(binder.compute());
            binder.owner[ binder.name ] = data;
            binder.owner.setAttribute(binder.name, data);
        }

    },

    reset (binder: any) {

        if (binder.meta.boolean) {
            binder.owner.removeAttribute(binder.name);
        } else {
            binder.owner[ binder.name ] = undefined;
            binder.owner?.setAttribute(binder.name, '');
        }

    }

};

