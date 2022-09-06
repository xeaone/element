export default {

    setup (binder: any) {
        binder.node.value = '';
        binder.meta.rerendered = false;
    },

    render (binder: any) {

        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }

        const inherited = binder.compute();
        binder.owner.inherited?.(inherited);

        if (!binder.meta.rerendered) {
            binder.meta.rerendered = true;
            binder.container.register(binder.owner, binder.context, binder.rewrites);
        }

    },

    reset (binder: any) {

        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }

        binder.owner.inherited?.();
    }

};
