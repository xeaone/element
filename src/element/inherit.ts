export default {

    setup (binder: any) {
        binder.node.value = '';
    },

    render (binder: any) {

        if (!binder.owner.inherited) {
            return console.warn(`inherited not implemented ${binder.owner.localName}`);
        }

        const inherited = binder.compute();
        binder.owner.inherited?.(inherited);
    },

    reset (binder: any) {

        if (!binder.owner.inherited) {
            return console.warn(`inherited not implemented ${binder.owner.localName}`);
        }

        binder.owner.inherited?.();
    }

};
