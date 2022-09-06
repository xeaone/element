
export default {

    render (binder: any) {
        const data = binder.compute();

        binder.node.nodeValue =
            typeof data == 'string' ? data :
                typeof data == 'undefined' ? '' :
                    typeof data == 'object' ? JSON.stringify(data) : data;

    },

    reset (binder: any) {
        binder.node.nodeValue = '';
    }

};
