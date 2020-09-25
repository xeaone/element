import Binder from '../binder.js';

export default function (binder, event) {

    if (binder.meta.busy) {
        return;
    } else {
        binder.meta.busy = true;
    }

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.target.addEventListener('input', event => Binder.render(binder, event));
    }

    return {
        read (ctx) {

            ctx.data = Boolean(binder.data);
            ctx.checked = Boolean(binder.target.checked);
            ctx.match = ctx.data === ctx.checked;

            if (ctx.match) {
                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

            if (event) {
                binder.data = ctx.checked;
                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

        },
        write (ctx) {
            binder.target.checked = ctx.data;
            binder.meta.busy = false;
        }
    };

}
