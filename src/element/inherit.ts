
const inheritRender = function (binder: any) {

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }

    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }

    const inherited = binder.compute();
    binder.owner.inherited?.(inherited);

};

const inheritUnrender = function (binder: any) {

    if (!binder.owner.inherited) {
        return console.warn(`inherited not implemented ${binder.owner.localName}`);
    }

    binder.owner.inherited?.();

};

export default { render: inheritRender, unrender: inheritUnrender };
