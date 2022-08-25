export default {

    setup (binder: any) {
        binder.node.nodeValue = '';
        // binder.meta.template = document.createElement('template');
    },

    async render (binder: any) {
        let data = binder.compute();

        // if (typeof data != 'string') {
        //     data = '';
        //     console.warn('html binder requires a string');
        // }

        // let removeChild = binder.owner.lastChild;
        // while (removeChild) {
        //     binder.owner.removeChild(removeChild);
        //     binder.release(removeChild);
        //     removeChild = binder.owner.lastChild;
        // }

        console.log(data);

        const clone = data.cloneNode(true);
        binder.container.register(clone.content, binder.context);

        await binder.container.render();
        binder.owner.appendChild(clone.content);
    },

    reset (binder: any) {
        // let node = binder.owner.lastChild;
        // while (node) {
        //     binder.owner.removeChild(node);
        //     binder.release(node);
        //     node = binder.owner.lastChild;
        // }
    }

};