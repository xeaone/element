import Binder from '../binder';
import { isBoolean, match } from '../tool';

export default function (binder, event) {
    let data, write;

    return {
        read(ctx) {
            data = binder.data;

            if (!binder.meta.setup) {
                binder.meta.setup = true;
                binder.target.addEventListener('input', event => Binder.render(binder, event));
            }

            if (isBoolean(data)) {
                ctx.checked = event ? binder.target.checked : data;
            } else {
                ctx.value = binder.getAttribute('value');
                ctx.checked = match(data, ctx.value);
            }

            if (event) {

                if (isBoolean(data)) {
                    binder.data = ctx.checked;
                } else {
                    binder.data = ctx.value;
                }

                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

        },
        write(ctx) {
            binder.target.checked = ctx.checked;
            binder.target.setAttribute('checked', ctx.checked);
            binder.meta.busy = false;
        }
    };
}
