
import {
    to,
    toString,
    toNumber,
    isNone
} from '../tool';

const input = async function (binder, event) {
    const { target } = binder;
    const { type } = target;
    let value;

    if (type === 'select-one') {
        const option = target?.selectedOptions?.[ 0 ];
        value = option ? '$value' in option ? option.$value : option.value : '';
        value = await binder.compute({ event, value });
        target.$value = value;
        target.value = isNone(value) ? '' : toString(value);
        target.setAttribute('value', target.value);
    } else if (type === 'select-multiple') {
        value = [ ...target.selectedOptions ].map(option => '$value' in option ? option.$value : option.value);
        value = await binder.compute({ event, value });
        target.$value = value;
        target.setAttribute('value', isNone(value) ? '' : toString(value));

        // } else if (type === 'checkbox' || type === 'radio') {
        //     value = binder.target.value;
        //     // value = to(binder.data, binder.target.value);
        //     value = await binder.compute({ $e: event, $event: event, $v: value, $value: value });
        //     binder.target.value = value;
        // } else if (type === 'number') {
        //     // value = toNumber(binder.target.value);
        //     value = binder.target.value;
        //     value = await binder.compute({ $e: event, $event: event, $v: value, $value: value });
        //     binder.target.value = value;
    } else if (type === 'file') {
        const multiple = binder.target.multiple;
        value = multiple ? [ ...binder.target.files ] : binder.target.files[ 0 ];
        value = await binder.compute({ event, value });
        target.$value = value;
        target.value = isNone(value) ? '' : multiple ? value.join(',') : value;
        target.setAttribute('value', target.value);
    } else {
        value = to(target.$value, target.value);
        value = await binder.compute({ event, value });
        target.$value = value;
        target.value = isNone(value) ? '' : toString(value);
        target.setAttribute('value', target.value);
    }

};

export default {
    async setup (binder) {
        binder.target.addEventListener('input', event => input(binder, event));
    },
    async write (binder) {
        const { target } = binder;
        const { type } = target;

        let value = binder.assignee();

        if (type === 'select-one') {

            for (const option of target.options) {
                const optionValue = option ? '$value' in option ? option.$value : option.value : undefined;
                option.selected = optionValue === value;
            }

            value = await binder.compute({ value });
            target.$value = value;
            target.value = isNone(value) ? '' : toString(value);
            target.setAttribute('value', target.value);

        } else if (type === 'select-multiple') {

            for (let index = 0; index < target.options; index++) {
                const option = target.options[ index ];
                const optionValue = option ? '$value' in option ? option.$value : option.value : undefined;
                option.selected = optionValue === value[ index ];
            }

            value = await binder.compute({ value });
            target.$value = value;
            target.setAttribute('value', isNone(value) ? '' : toString(value));

            // let value;
            // if (!(data?.constructor instanceof Array) || !data.length) {
            //     value = binder.data = [ ...binder.target.selectedOptions ].map(o => o.value);
            // } else {
            //     value = [ ...binder.target.options ].map((o, i) => {
            //         o.selected = o.value == data[ i ];
            //         return o.value;
            //     });
            // }

            // value = value.join(',');
            // binder.target.setAttribute('value', value);

            // } else if (type === 'file') {
            // context.multiple = binder.target.multiple;
            // context.value = context.multiple ? [ ...binder.target.files ] : binder.target.files[ 0 ];
            // } else if (type === 'number') {
            //     binder.target.value = data;
            //     binder.target.setAttribute('value', data);
            // } else if (type === 'checkbox' || type === 'radio') {
            //     binder.target.value = data;
            //     binder.target.toggleAttribute('value', data);
        } else {
            value = await binder.compute({ value });
            target.$value = value;
            target.value = isNone(value) ? '' : toString(value);
            target.setAttribute('value', target.value);
        }

    }
};

// export default function (binder) {
//     console.log('not event');
//     const type = binder.target.type;
//     const ctx = {};

//     if (!binder.meta.listener) {
//         binder.meta.listener = true;
//         binder.target.addEventListener('input', () => input(binder));
//     }

//     if (type === 'select-one') {
//         return {
//             async read () {
//                 ctx.data = await binder.compute();
//                 ctx.value = binder.target.value;
//             },
//             async write () {
//                 let value;

//                 if ('' === ctx.data || null === ctx.data || undefined === ctx.data) {
//                     value = binder.data = ctx.value;
//                 } else {
//                     value = binder.target.value = ctx.data;
//                 }

//                 binder.target.setAttribute('value', value);
//             }
//         };
//     } else if (type === 'select-multiple') {
//         return {
//             async read () {
//                 ctx.data = await binder.compute();
//                 ctx.options = [ ...binder.target.options ];
//                 ctx.value = [ ...binder.target.selectedOptions ].map(o => o.value);
//             },
//             async write () {
//                 let value;

//                 if (!(ctx.data?.constructor instanceof Array) || !ctx.data.length) {
//                     value = binder.data = ctx.value;
//                 } else {
//                     value = '';
//                     ctx.options.forEach((o, i) => {
//                         o.selected = o.value == ctx.data[ i ];
//                         value += `${o.value},`;
//                     });
//                 }

//                 binder.target.setAttribute('value', value);
//             }
//         };
//     } else if (type === 'checkbox' || type === 'radio') {
//         let data;
//         return {
//             async read () {
//                 data = await binder.data;
//             },
//             async write () {
//                 binder.target.value = data;
//                 binder.target.setAttribute('value', data);
//             }
//         };
//     } else if (type === 'number') {
//         return {
//             read () {
//                 ctx.data = binder.data;
//                 ctx.value = toNumber(binder.target.value);
//             },
//             write () {
//                 ctx.value = toString(ctx.data);
//                 binder.target.value = ctx.value;
//                 binder.target.setAttribute('value', ctx.value);
//             }
//         };
//     } else if (type === 'file') {
//         return {
//             read () {
//                 ctx.data = binder.data;
//                 ctx.multiple = binder.target.multiple;
//                 ctx.value = ctx.multiple ? [ ...binder.target.files ] : binder.target.files[ 0 ];
//             }
//         };
//     } else {
//         return {
//             read () {
//                 // if (binder.target.nodeName === 'O-OPTION' || binder.target.nodeName === 'OPTION') return ctx.write = false;

//                 ctx.data = binder.data;
//                 ctx.value = binder.target.value;
//                 // ctx.match = match(ctx.data, ctx.value);
//                 // ctx.selected = binder.target.selected;

//                 // if (ctx.match) {
//                 //     binder.meta.busy = false;
//                 //     ctx.write = false;
//                 //     return;
//                 // }

//                 // if (
//                 //     binder.target.parentElement &&
//                 //     (binder.target.parentElement.type === 'select-one'||
//                 //     binder.target.parentElement.type === 'select-multiple')
//                 // ) {
//                 //     ctx.select = binder.target.parentElement;
//                 // } else if (
//                 //     binder.target.parentElement &&
//                 //     binder.target.parentElement.parentElement &&
//                 //     (binder.target.parentElement.parentElement.type === 'select-one'||
//                 //     binder.target.parentElement.parentElement.type === 'select-multiple')
//                 // ) {
//                 //     ctx.select = binder.target.parentElement.parentElement;
//                 // }
//                 //
//                 // if (ctx.select) {
//                 //     const attribute = ctx.select.attributes['o-value'] || ctx.select.attributes['value'];
//                 //     if (!attribute) return ctx.write = false;
//                 //     ctx.select = Binder.get(attribute);
//                 //     ctx.multiple = ctx.select.target.multiple;
//                 // }

//             },
//             write () {
//                 // const { select, selected, multiple } = ctx;

//                 // if (select) {
//                 //     if (multiple) {
//                 //         const index = Index(select.data, ctx.data);
//                 //         if (event) {
//                 //             if (selected && index === -1) {
//                 //                 select.data.push(ctx.data);
//                 //             } else if (!selected && index !== -1) {
//                 //                 select.data.splice(index, 1);
//                 //             }
//                 //         } else {
//                 //             if (index === -1) {
//                 //                 binder.target.selected = false;
//                 //             } else {
//                 //                 binder.target.selected = true;
//                 //             }
//                 //         }
//                 //     } else {
//                 //         const match = match(select.data, ctx.data);
//                 //         if (event) {
//                 //             // console.log(match);
//                 //             // console.log(select.data);
//                 //             // console.log(ctx.data);
//                 //             if (selected !== match) {
//                 //                 select.data = ctx.data;
//                 //                 // console.log(select.data);
//                 //                 // throw 'stop';
//                 //             }
//                 //         } else {
//                 //             if (match) {
//                 //                 binder.target.selected = true;
//                 //             } else {
//                 //                 binder.target.selected = false;
//                 //             }
//                 //         }
//                 //     }
//                 // }

//                 binder.target.value = ctx.data ?? '';
//             }
//         };
//     }
// }
