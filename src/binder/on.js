import Batcher from '../batcher.js';

export default function (binder) {
    const type = binder.names[1];

    binder.target[`on${type}`] = null;

    if (binder.meta.method) {
        binder.target.removeEventListener(type, binder.meta.method);
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

    binder.meta.method = event => {
        binder.data.call(binder.container, event);
    };

    binder.target.addEventListener(type, binder.meta.method);
}

// export default function (binder) {
//     return {
//         read () {

//         },
//         write () {
//         }
//     };
// }
