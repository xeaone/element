import Match from '../tool/match.js';
import Binder from '../binder.js';

import {
    isBoolean,
    toBoolean
} from '../tool.js';

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

            if (isBoolean(ctx.data)) {
                ctx.checked = event ? binder.target.checked : ctx.data;
            } else {
                ctx.value = binder.getAttribute('value');
                ctx.checked = Match(ctx.data, ctx.value);
            }

            if (event) {

                if (isBoolean(ctx.data)) {
                    binder.data = ctx.checked;
                } else {
                    binder.data = ctx.value;
                }

                binder.meta.busy = false;
                ctx.write = false;
                return;
            }

        },
        write (ctx) {
            binder.target.checked = ctx.checked;
            binder.target.setAttribute('checked', ctx.checked);
            binder.meta.busy = false;
        }
    };
}
