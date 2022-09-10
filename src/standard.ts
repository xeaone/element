import booleans from './boolean';

export default {

    setup (binder: any) {
        binder.node.value = '';
        binder.meta.boolean = booleans.includes(binder.name);
    },

    render (binder: any) {

        if (binder.name == 'text') {
            const data = binder.compute();

            binder.node.nodeValue =
                typeof data == 'string' ? data :
                    typeof data == 'undefined' ? '' :
                        typeof data == 'object' ? JSON.stringify(data) : data;

        } else if (binder.meta.boolean) {
            const data = binder.compute() ? true : false;
            if (data) binder.owner.setAttributeNode(binder.node);
            else binder.owner.removeAttribute(binder.name);
        } else {
            let data = binder.compute();

            data =
                typeof data == 'string' ? data :
                    typeof data == 'undefined' ? '' :
                        typeof data == 'object' ? JSON.stringify(data) : data;

            binder.owner[ binder.name ] = data;
            binder.owner.setAttribute(binder.name, data);
        }

    },

    reset (binder: any) {
        if (binder.name == 'text') {
            binder.node.nodeValue = '';
        } else if (binder.meta.boolean) {
            binder.owner.removeAttribute(binder.name);
        } else {
            binder.owner[ binder.name ] = undefined;
            binder.owner?.setAttribute(binder.name, '');
        }
    }

};