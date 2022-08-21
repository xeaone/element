import Binder from './binder';

export default {

    render (binder: any) {
        const owner = binder.owner as any;
        const node = (binder.node as any);

        if (!binder.meta.setup) {
            binder.meta.setup = true;
            node.value = '';
        }

        if (!owner.inherited) {
            return console.warn(`inherited not implemented ${owner.localName}`);
        }

        const inherited = binder.compute();
        owner.inherited?.(inherited);
    },

    reset (binder: any) {
        const owner = binder.owner as any;

        if (!owner.inherited) {
            return console.warn(`inherited not implemented ${owner.localName}`);
        }

        owner.inherited?.();
    }

};
