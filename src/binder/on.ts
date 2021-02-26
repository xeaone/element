// import Batcher from '../batcher';

export default function (binder) {

    binder.target[binder.name] = null;
    const name = binder.name.slice(2);

    if (binder.meta.method) {
        binder.target.removeEventListener(name, binder.meta.method);
    }

    // binder.meta.method = (event) => {
    //     Batcher.batch({
    //         read (ctx) {
    //             ctx.data = binder.data;
    //             ctx.container = binder.container;
    //             if (typeof ctx.data !== 'function') {
    //                 ctx.write = false;
    //                 return;
    //             }
    //         },
    //         write (ctx) {
    //             ctx.data.call(ctx.container, event);
    //         }
    //     });
    // };

    binder.meta.method = binder.data;

    // binder.meta.method = event => {
    //     binder.data.call(binder.container, event);
    // };

    binder.target.addEventListener(name, binder.meta.method);
}

// export default function (binder) {
//     return {
//         read () {

//         },
//         write () {
//         }
//     };
// }
