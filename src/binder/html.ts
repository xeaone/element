import Binder from '../binder';
import { toString } from '../tool';

export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (data === undefined || data === null) {
                data = '';
            } else {
                data = toString(data);
            }

        },
        write () {

            while (binder.target.firstChild) {
                const node = binder.target.removeChild(binder.target.firstChild);
                Binder.remove(node);
            }

            const fragment = document.createDocumentFragment();
            const parser = document.createElement('div');

            parser.innerHTML = data;

            while (parser.firstElementChild) {
                Binder.add(parser.firstElementChild, { container: binder.container });
                fragment.appendChild(parser.firstElementChild);
            }

            binder.target.appendChild(fragment);
        }
    };
}
