const event = new Event('inherit');

const inherit = async function (binder) {
    binder.node.value = '';

    if (binder.owner.isRendered) {
        // console.log(binder.owner.localName, binder.owner.isConnected);
        const inherited = await binder.compute();
        binder.owner.inherited?.(inherited);
    } else {
        binder.owner.addEventListener('afterrender', async () => {
            // console.log(binder.owner.localName, binder.owner.isConnected, 'afterrender', binder);
            const inherited = await binder.compute();
            // console.log(inherited, binder);
            binder.owner.inherited?.(inherited);
        });
    }

    // if (binder.owner.$isRendered) {
    //     const inherited = await binder.compute();
    //     binder.owner.inherited?.(inherited);
    // } else {
    //     binder.owner.addEventListener('beforeconnected', async () => {
    //         const inherited = await binder.compute();
    //         binder.owner.inherited?.(inherited);
    //     });
    // }

};

export default inherit;

