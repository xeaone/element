
const inheritRender = async function (binder) {

    let setup = binder.meta.setup ?? false;
    if (!setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }

    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }

    const inherited = await binder.compute();
    binder.owner.inherited?.(inherited, setup);

};

const inheritUnrender = async function (binder) {

    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }

    binder.owner.inherited?.();

};

export default { render: inheritRender, unrender: inheritUnrender };

