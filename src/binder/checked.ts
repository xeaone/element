import Binder from '../binder';
import { isBoolean, match } from '../tool';

export default function (binder, event) {
    let data, value, checked;
    return {
        async read () {
            data = await binder.expression();

            if (!binder.meta.setup) {
                binder.meta.setup = true;
                binder.target.addEventListener('input', event => Binder.render(binder, event));
            }

            if (isBoolean(data)) {
                checked = event ? binder.target.checked : data;
            }

            if (event) {
                if (isBoolean(data)) {
                    binder.data = checked;
                }
            }

            console.log('checked', data);
        },
        async write () {
            binder.target.checked = checked;
            if (checked) {
                binder.target.setAttribute('checked', '');
            } else {
                binder.target.removeAttribute('checked');
            }
        }
    };
}
