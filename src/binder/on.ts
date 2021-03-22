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

const reset = async function (binder, event) {
    event.preventDefault();

    const elements = event.target.querySelectorAll('*');
    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const name = element.nodeName;
        const type = element.type;

        if (
            !type && name !== 'TEXTAREA' ||
            type === 'submit' ||
            type === 'button' ||
            !type
        ) {
            continue;
        }

        const binder = Binder.get(element)?.get('value');

        if (!binder) {
            if (type === 'select-one' || type === 'select-multiple') {
                element.selectedIndex = null;
            } else if (type === 'radio' || type === 'checkbox') {
                element.checked = false;
            } else {
                element.value = null;
            }
        } else if (type === 'select-one') {
            binder.data = null;
        } else if (type === 'select-multiple') {
            binder.data = [];
        } else if (type === 'radio' || type === 'checkbox') {
            binder.data = false;
        } else {
            binder.data = '';
        }

    }

    const method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, event);
    }

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
            if (name === 'reset') {
                return reset.call(binder.container, event, binder);
            } else if (name === 'submit') {
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
