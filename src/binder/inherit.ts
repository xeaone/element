const inherit = async function (binder) {
    const { owner } = binder;

    owner.addEventListener('beforeconnected', async () => {
        Object.assign(owner.data, await binder.compute() || {});
        owner.inherited?.();
    });

};

export default inherit;

