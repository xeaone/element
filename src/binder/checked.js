import Match from '../tool/match.js';
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

            ctx.data = binder.data;
            ctx.value = binder.getAttribute('value');
            ctx.match = Match(ctx.data, ctx.value);

            if (ctx.match === binder.target.checked) {
                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

            if (event) {
                binder.data = ctx.value;
                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

        },
        write (ctx) {
            binder.target.checked = ctx.match;
            binder.meta.busy = false;
        }
    };
}
