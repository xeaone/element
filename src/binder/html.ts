
const html = {
    async write (binder) {
        let data = await binder.compute();

        if (typeof data !== 'string') {
            data = '';
            console.error('html binder requires a string');
        }

        while (binder.target.firstChild) {
            const node = binder.target.removeChild(binder.target.firstChild);
            binder.remove(node);
        }

        const fragment = document.createDocumentFragment();
        const parser = document.createElement('div');

        parser.innerHTML = data;

        while (parser.firstElementChild) {
            binder.add(parser.firstElementChild, { container: binder.container });
            fragment.appendChild(parser.firstElementChild);
        }

        binder.target.appendChild(fragment);
    }
};

export default html;