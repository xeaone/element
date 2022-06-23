import Binder from './binder.ts';

export default class inherit extends Binder {

    render () {
        const owner = this.owner as any;
        const node = (this.node as any);

        if (!this.meta.setup) {
            this.meta.setup = true;
            node.value = '';
        }

        if (!owner.inherited) {
            return console.warn(`inherited not implemented ${owner.localName}`);
        }

        const inherited = this.compute();
        owner.inherited?.(inherited);
    }

    reset () {
        const owner = this.owner as any;

        if (!owner.inherited) {
            return console.warn(`inherited not implemented ${owner.localName}`);
        }

        owner.inherited?.();
    }

}
