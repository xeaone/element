
export default {

    async render (binder: any) {
        const data = binder.compute();

        binder.node.nodeValue =
            typeof data == 'string' ? data :
                typeof data == 'undefined' ? '' :
                    typeof data == 'object' ? JSON.stringify(data) : data;

    },

    async reset (binder: any) {
        binder.node.nodeValue = '';
    }

};
