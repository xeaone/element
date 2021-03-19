// import Batcher from '../batcher';
import Binder from '../binder';

const submit = async function (event, binder) {
    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        if (
            (!element.type && element.nodeName !== 'TEXTAREA') ||
            element.type === 'submit' ||
            element.type === 'button' ||
            !element.type
        ) continue;

        const attribute = element.attributes['o-value'];
        const b = Binder.get(attribute);

        console.warn('todo: need to get a value for selects');

        const value = (
            b ? b.data : (
                element.files ? (
                    element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0]
                ) : element.value
            )
        );

        const name = element.name || (b ? b.values[b.values.length - 1] : null);

        if (!name) continue;
        data[name] = value;
    }

    // if (typeof binder.data === 'function') {
    //     await binder.data.call(binder.container, data, event);
    // }

    const method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, event, data);
    }

    if (binder.getAttribute('reset')) {
        event.target.reset();
    }

    return false;
};

export default function (binder) {

    const read = function () {
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

        binder.meta.method = event => {
            if (name === 'submit') {
                return submit.call(binder.container, event, binder);
            } else {
                return binder.data.call(binder.container, event);
            }
        }

        binder.target.addEventListener(name, binder.meta.method);
    };

    return { read };
}

// export default function (binder) {
//     return {
//         read () {

//         },
//         write () {
//         }
//     };
// }
