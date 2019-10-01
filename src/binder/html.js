
export default function (binder) {
    const self = this;
    let data;
    return {
        read () {
            data = binder.data;

            if (data === undefined || data === null) {
                data = '';
            } else if (typeof data === 'object') {
                data = JSON.stringify(data);
            } else if (typeof data !== 'string') {
                data = String(data);
            }

        },
        write () {

            while (binder.target.firstChild) {
                const node = binder.target.removeChild(binder.target.firstChild);
                self.remove(node);
            }

            const fragment = document.createDocumentFragment();
            const parser = document.createElement('div');

            parser.innerHTML = data;

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
