
import {
    to,
    toString,
    toNumber,
    isNone
} from '../tool';

// properties to consider: defaultValue, valueAsDate, valueAsNumber

const input = async function (binder, event) {
    const { owner } = binder;
    const { type } = owner;

    if (type === 'select-one') {
        const [ option ] = owner?.selectedOptions;
        const value = option && '$value' in option ? option.$value : option?.value || undefined;
        const computed = await binder.compute({ event, value });
        owner.$value = computed;
        owner.value = isNone(computed) ? '' : toString(computed);
        owner.setAttribute('value', owner.value);
    } else if (type === 'select-multiple') {

        const value = [];
        for (const option of owner?.selectedOptions) {
            if ('$value' in option) {
                value.push(option.$value);
            } else if (option.value) {
                value.push(option.value);
            }
        }

        const computed = await binder.compute({ event, value });
        owner.$value = computed;
        owner.setAttribute('value', isNone(computed) ? '' : toString(computed));

        // } else if (type === 'number') {
        //     // value = toNumber(binder.owner.value);
        //     value = binder.owner.value;
        //     value = await binder.compute({ $e: event, $event: event, $v: value, $value: value });
        //     binder.owner.value = value;
    } else if (type === 'file') {
        const { multiple, files } = owner;
        const value = multiple ? [ ...files ] : files[ 0 ];
        const computed = await binder.compute({ event, value });
        owner.$value = computed;
        owner.value = isNone(computed) ? '' : multiple ? computed.join(',') : computed;
        owner.setAttribute('value', owner.value);
    } else {
        const value = to(owner.$value, owner.value);
        const checked = type === 'checkbox' || type === 'radio' ? ('$checked' in owner ? owner.$checked : owner.checked) : undefined;
        const computed = await binder.compute({ event, value, checked });
        owner.$value = computed;
        owner.value = isNone(computed) ? '' : toString(computed);
        owner.setAttribute('value', owner.value);
    }

};

export default {
    async setup (binder) {
        binder.owner.addEventListener('input', event => input(binder, event));
    },
    async write (binder) {
        const { owner } = binder;
        const { type } = owner;

        const value = binder.assignee();

        if (type === 'select-one' || type === 'select-multiple') {
            const { multiple, options } = owner;
            owner.selectedIndex = -1;

            for (const option of options) {
                const optionValue = '$value' in option ? option.$value : option.value;
                option.selected = multiple ? value?.includes(optionValue) : optionValue === value;
                if (!multiple && option.selected) break;
            }

            let computed;
            if (!multiple && owner.selectedIndex === -1 && value === undefined) {
                const [ option ] = owner.options;
                computed = await binder.compute({
                    value: option ? ('$value' in option ? option.$value : option.value) : undefined
                });
            } else {
                computed = await binder.compute({ value });
            }

            owner.$value = computed;

            if (multiple) {
                owner.setAttribute('value', isNone(computed) ? '' : toString(computed));
            } else {
                owner.value = isNone(computed) ? '' : toString(computed);
                owner.setAttribute('value', owner.value);
            }
            // } else if (type === 'file') {
            // context.multiple = owner.multiple;
            // context.value = context.multiple ? [ ...owner.files ] : owner.files[ 0 ];
            // } else if (type === 'number') {
            //     owner.value = data;
            //     owner.setAttribute('value', data);
            // } else if (type === 'checkbox' || type === 'radio') {
            //     owner.value = data;
            //     owner.toggleAttribute('value', data);
        } else {
            const checked = type === 'checkbox' || type === 'radio' ? ('$checked' in owner ? owner.$checked : owner.checked) : undefined;
            const computed = await binder.compute({ value, checked });
            owner.$value = computed;
            owner.value = isNone(computed) ? '' : toString(computed);
            owner.setAttribute('value', owner.value);
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
