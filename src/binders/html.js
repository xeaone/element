
export default function (binder) {
    const self = this;
    return {
        read () {
            this.data = binder.data;

            if (this.data === undefined || this.data === null) {
                this.data = '';
            } else if (typeof this.data !== 'string') {
                this.data = String(this.data);
            }

        },
        write () {

            while (binder.target.firstChild) {
                const node = binder.target.removeNode(binder.target.firstChild);
                self.remove(node);
            }

            const fragment = document.createDocumentFragment();
            const parser = document.createElement('div');

            parser.innerHTML = this.data;

            while (parser.firstElementChild) {

                self.add(parser.firstElementChild, {
                    container: binder.container,
                    scope: binder.container.scope
                });

                fragment.appendChild(parser.firstElementChild);
            }

            binder.target.appendChild(fragment);
        }
    };
}
