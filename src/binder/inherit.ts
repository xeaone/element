
const inherit = async function (binder) {
    if (binder.cancel) return binder.cancel();

    binder.node.value = '';

    if (binder.owner.isRendered) {
        const inherited = await binder.compute();
        if (binder.cancel) return binder.cancel();
        binder.owner.inherited?.(inherited);
    } else {
        binder.owner.addEventListener('afterrender', async () => {
            const inherited = await binder.compute();
            if (binder.cancel) return binder.cancel();
            binder.owner.inherited?.(inherited);
        });
    }

};

export default inherit;

