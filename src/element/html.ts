export default {

    render (binder: any) {
        let data = binder.compute();

        let fragment, node;

        if (typeof data == 'string') {
            const template = document.createElement('template');
            template.innerHTML = data;
            fragment = template.content;
        } else if (data instanceof HTMLTemplateElement) {
            fragment = data.content.cloneNode(true);
        } else {
            return console.error(`XElement - Html Binder ${binder.name} ${binder.value} requires a string or Template`);
        }

        node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.container.release(node);
            node = binder.owner.lastChild;
        }

        node = fragment.firstChild;
        while (node) {
            binder.container.register(node, binder.context);
            node = node.nextSibling;
        }

        binder.owner.appendChild(fragment);
    },

    reset (binder: any) {

        let node = binder.owner.lastChild;
        while (node) {
            binder.owner.removeChild(node);
            binder.container.release(node);
            node = binder.owner.lastChild;
        }

    }

};