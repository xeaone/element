import format from './format';

export default {

    render (binder: any) {
        binder = binder ?? this;
        const data = binder.compute();
        binder.node.nodeValue = format(data);
    },

    reset (binder: any) {
        binder = binder ?? this;
        binder.node.nodeValue = '';
    }

};
