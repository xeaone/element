export default {

    setup (binder: any) {
        binder.node.nodeValue = '';
    },

    async render (binder: any) {
        let data = await binder.compute();

        let fragment, node;

        if (typeof data == 'string') {
            const template = document.createElement('template');
            template.innerHTML = data;
            fragment = template.content;
        } else if (data instanceof HTMLTemplateElement) {
            fragment = data.content.cloneNode(true);
        } else {
            return console.error('html binder requires a string or Template');
        }

        node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.release(node);
            node = binder.owner.lastChild;
        }

        node = fragment.firstChild;
        while (node) {
            binder.container.register(node, binder.context);
            node = node.nextSibling;
        }

        await binder.container.render();
        binder.owner.appendChild(fragment);
    },

    async reset (binder: any) {

        let node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.release(node);
            node = binder.owner.lastChild;
        }

        await binder.container.render();
    }

};