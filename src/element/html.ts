export default {

    setup (binder: any) {
        binder.node.nodeValue = '';
    },

    async render (binder: any) {
        let data = binder.compute();

        // if (typeof data !== 'string') {
        //     data = '';
        // }
        let fragment;

        if (typeof data == 'string') {
            const template = document.createElement('template');
            template.innerHTML = data;
            fragment = template.content;
        } else if (data instanceof HTMLTemplateElement) {
            fragment = data.content.cloneNode(true);
        } else {
            console.warn('html binder requires a string or template');
            return;
        }

        let removeChild = binder.owner.lastChild;
        while (removeChild) {
            binder.owner.removeChild(removeChild);
            binder.release(removeChild);
            removeChild = binder.owner.lastChild;
        }

        let addChild = fragment.firstChild;
        while (addChild) {
            binder.container.register(addChild, binder.context);
            addChild = addChild.nextSibling;
        }

        await binder.container.render();
        binder.owner.appendChild(fragment);
    },

    reset (binder: any) {
        let node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.release(node);
            node = binder.owner.lastChild;
        }
    }

};