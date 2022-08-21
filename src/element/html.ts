
export default {

    render (binder: any) {

        if (!binder.meta.setup) {
            binder.meta.setup = true;
            binder.node.nodeValue = '';
        }

        let data = binder.compute();

        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }

        let removeChild = binder.owner?.lastChild;
        while (removeChild) {
            binder.owner?.removeChild(removeChild);
            binder.release(removeChild);
            removeChild = binder.owner?.lastChild;
        }

        const template = document.createElement('template');
        template.innerHTML = data;

        let addChild = template.content.firstChild;
        while (addChild) {
            binder.container.register(addChild, binder.context);
            // binder.register(addChild, binder.context);
            addChild = addChild.nextSibling;
        }

        binder.owner?.appendChild(template.content);
    },

    reset (binder: any) {
        let node = binder.owner?.lastChild;
        while (node) {
            binder.release(node);
            binder.owner?.removeChild(node);
            node = binder.owner?.lastChild;
        }
    }

};