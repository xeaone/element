import format from './format';

export default {

    async render (binder: any) {
        binder = binder ?? this;
        const data = binder.compute();
        binder.node.nodeValue = format(data);
    },

    async reset (binder: any) {
        binder = binder ?? this;
        binder.node.nodeValue = '';
    }

};
