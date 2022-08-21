import format from './format';

export default {

    render (binder:any) {
        const data = binder.compute();
        binder.node.nodeValue = format(data);
    },

    reset (binder:any) {
        binder.node.nodeValue = '';
    }

};
