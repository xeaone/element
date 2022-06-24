import Binder from './binder.ts';

export default class Html extends Binder {

    render () {

        if (!this.meta.setup) {
            this.meta.setup = true;
            this.node.nodeValue = '';
        }

        let data = this.compute();

        if (typeof data !== 'string') {
            data = '';
            console.warn('html binder requires a string');
        }

        let removeChild = this.owner?.lastChild;
        while (removeChild) {
            this.owner?.removeChild(removeChild);
            this.release(removeChild);
            removeChild = this.owner?.lastChild;
        }

        const template = document.createElement('template');
        template.innerHTML = data;

        let addChild = template.content.firstChild;
        while (addChild) {
            this.register(addChild, this.context);
            addChild = addChild.nextSibling;
        }

        this.owner?.appendChild(template.content);
    }

    reset () {
        let node = this.owner?.lastChild;
        while (node) {
            this.release(node);
            this.owner?.removeChild(node);
            node = this.owner?.lastChild;
        }
    }

}