
export default function (binder) {
    return {
        read (ctx) {
            ctx.data = binder.data;

            if (ctx.data === undefined || ctx.data === null) {
                ctx.data = '';
            } else if (typeof ctx.data === 'object') {
                ctx.data = JSON.stringify(ctx.data);
            } else if (typeof ctx.data !== 'string') {
                ctx.data = ctx.data.toString();
            }

            if (ctx.data === binder.target.textContent) {
                return ctx.write = false;
            }

        },
        write (ctx) {
            binder.target.textContent = ctx.data;
        }
    };
}
