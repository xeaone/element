import format from './format';

export default {

    async render (binder: any) {
        const data = binder.compute();
        binder.node.nodeValue = format(data);
    },

    async reset (binder: any) {
        binder.node.nodeValue = '';
    }

};
