const event = new Event('inherit');

const inherit = async function (binder) {
    binder.node.value = '';

    if (binder.owner.isRendered) {
        const inherited = await binder.compute();
        binder.owner.inherited?.(inherited);
    } else {
        binder.owner.addEventListener('beforeconnected', async () => {
            const inherited = await binder.compute();
            binder.owner.inherited?.(inherited);
        });
    }

};

export default inherit;

