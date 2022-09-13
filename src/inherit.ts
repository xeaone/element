export default {

    setup (binder: any) {
        binder.node.value = '';
        binder.meta.rerendered = false;
    },

    async render (binder: any) {

        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }

        const inherited = await binder.compute();
        await binder.owner.inherited?.(inherited);

        if (!binder.meta.rerendered) {
            binder.meta.rerendered = true;
            await binder.container.register(binder.owner, binder.context, binder.rewrites);
        }

    },

    async reset (binder: any) {

        if (!binder.owner.inherited) {
            return console.error(`XElement - Inherit Binder ${binder.name} ${binder.value} requires Function`);
        }

        await binder.owner.inherited?.();
    }

};
