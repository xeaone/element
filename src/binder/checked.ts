import Binder from '../binder';
import { isBoolean, match } from '../tool';

export default function (binder, event) {
    let data, value, checked;

    return {
        async read () {
            data = await binder.data;

            if (!binder.meta.setup) {
                binder.meta.setup = true;
                binder.target.addEventListener('input', event => Binder.render(binder, event));
            }

            if (isBoolean(data)) {
                checked = event ? binder.target.checked : data;
            } else {
                value = binder.getAttribute('value');
                checked = match(data, value);
            }

            if (event) {
                if (isBoolean(data)) {
                    binder.data = checked;
                } else {
                    binder.data = value;
                }
            }

        },
        async write () {
            binder.target.checked = checked;
            binder.target.setAttribute('checked', checked);
        }
    };
}
