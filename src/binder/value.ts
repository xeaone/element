import { index as Index, match as Match } from '../tool';
import Binder from '../binder';
// import Includes from '../tool/includes';

import {
    to,
    toString,
    toNumber
} from '../tool';

const input = function (binder) {
    const type = binder.target.type;

    if (type === 'select-one' || type === 'select-multiple') {

    } else if (type === 'checkbox' || type === 'radio') {
        binder.data = to(binder.data, binder.target.value);
    } else if (type === 'number') {
        binder.data = toNumber(binder.target.value);
    } else if (type === 'file') {
        const multiple = binder.target.multiple;
        binder.data = multiple ? [...binder.target.files] : binder.target.files[0];
    } else {
        binder.data = binder.target.value;
    }
};

export default function (binder, event) {
    const type = binder.target.type;

    // if (binder.meta.busy) {
    //     console.log('busy value');
    //     return;
    // } else {
    //     binder.meta.busy = true;
    // }

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.target.addEventListener('input', () => input(binder));
        // binder.target.addEventListener('input', event => Binder.render(binder, event));
        // binder.target.addEventListener('change', event => Binder.render(binder, event));
    }

    if (type === 'select-one' || type === 'select-multiple') {
        return {
            read (ctx) {

                console.log(event);
                console.log(binder.target);
                console.log(binder.data);

                ctx.selectBinder = binder;
                ctx.select = binder.target;
                ctx.options = binder.target.options;
                ctx.multiple = binder.target.multiple;

                if (ctx.multiple && binder.data instanceof Array === false) {
                    ctx.data = binder.data = [];
                    // binder.meta.busy = false;
                    // throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                } else {
                    ctx.data = binder.data;
                }

                ctx.selects = [];
                ctx.unselects = [];

                for (let i = 0; i < ctx.options.length; i++) {
                    const node = ctx.options[i];
                    const selected = node.selected;
                    const attribute = node.attributes['o-value'] || node.attributes['value'];
                    const option = Binder.get(attribute) || { get data () { return node.value; }, set data (data) { node.value = data; } };
                    if (ctx.multiple) {
                        const index = Index(binder.data, option.data);
                        if (event) {
                            if (selected && index === -1) {
                                binder.data.push(option.data);
                            } else if (!selected && index !== -1) {
                                binder.data.splice(index, 1);
                            }
                        } else {
                            if (index === -1) {
                                ctx.unselects.push(node);
                                // option.selected = false;
                            } else {
                                ctx.selects.push(node);
                                // option.selected = true;
                            }
                        }
                    } else {
                        const match = Match(binder.data, option.data);
                        if (event) {
                            if (selected && !match) {
                                binder.data = option.data;
                            } else if (!selected && match) {
                                continue;
                            }
                        } else {
                            if (match) {
                                ctx.selects.push(node);
                                // option.selected = true;
                            } else {
                                ctx.unselects.push(node);
                                // option.selected = false;
                            }
                        }
                    }
                }

                // if (binder.data === ctx.data) {
                //     return ctx.write = false;
                // }

                // for (let i = 0; i < ctx.options.length; i++) {
                //     const target = ctx.options[i];
                //     const attribute = target.attributes['o-value'] || target.attributes['value'];
                //     Binder.render(
                //         Binder.get(attribute) ||
                //         { meta: {}, target, get data () { return target.value; }, set data (data) { target.value = data; } },
                //         event
                //     );
                // }

                // binder.meta.busy = false;
            },
            write (ctx) {
                const { selects, unselects } = ctx;

                selects.forEach(option => {
                    option.selected = true;
                    console.log(option, option.selected, 'select');
                });

                unselects.forEach(option => {
                    option.selected = false;
                    console.log(option, option.selected, 'unselects');
                });

                // const { options, multiple, selectBinder } = ctx;
                //
                // for (let i = 0; i < options.length; i++) {
                //     const option = options[i];
                //     const selected = option.selected;
                //
                //     const attribute = option.attributes['o-value'] || option.attributes['value'];
                //     const optionBinder = Binder.get(attribute) || { get data () { return option.value; }, set data (data) { option.value = data; } };
                //
                //     if (multiple) {
                //         const index = Index(ctx.data, optionBinder.data);
                //         if (event) {
                //             if (selected && index === -1) {
                //                 ctx.data.push(optionBinder.data);
                //             } else if (!selected && index !== -1) {
                //                 ctx.data.splice(index, 1);
                //             }
                //         } else {
                //             if (index === -1) {
                //                 option.selected = false;
                //             } else {
                //                 option.selected = true;
                //             }
                //         }
                //     } else {
                //         const match = match(ctx.data, optionBinder.data);
                //         if (event) {
                //             if (selected && !match) {
                //                 binder.data = optionBinder.data;
                //                 break;
                //             }
                //         } else {
                //             if (match) {
                //                 option.selected = true;
                //             } else {
                //                 option.selected = false;
                //             }
                //         }
                //     }
                // }

                // if (binder.data !== data) {
                //     binder.data = data;
                // }

                binder.meta.busy = false;
            }
            //
            //     const fallback = [];
            //     const multiple = ctx.multiple;
            //     const options = ctx.options;
            //     for (let i = 0; i < options.length; i++) {
            //
            //         const option = options[i];
            //         const selected = option.selected;
            //         const optionBinder = Binder.get(option, 'value');
            //         const value = optionBinder ? optionBinder.data : option.value;
            //
            //         if (option.hasAttribute('selected')) {
            //             fallback.push({ option, value });
            //         }
            //
            //         // console.log(binder.data, value, binder.data===value);
            //
            //         if (e) {
            //             if (multiple) {
            //                 if (selected) {
            //                     const includes = Includes(binder.data, value);
            //                     if (!includes) {
            //                         binder.data.push(value);
            //                     }
            //                 } else {
            //                     const index = Index(binder.data, value);
            //                     if (index !== -1) {
            //                         binder.data.splice(index, 1);
            //                     }
            //                 }
            //             } else {
            //                 if (selected) {
            //                     binder.data = value;
            //                     break;
            //                 }
            //             }
            //         } else {
            //             if (multiple) {
            //                 const includes = Includes(binder.data, value);
            //                 if (includes) {
            //                     option.selected = true;
            //                 } else {
            //                     option.selected = false;
            //                 }
            //             } else {
            //                 const match = match(binder.data, value);
            //                 if (match) {
            //                     option.selected = true;
            //                     break;
            //                 }
            //             }
            //         }
            //     }
            //
            //     if (ctx.selectedIndex === -1) {
            //         if (multiple) {
            //             for (let i = 0; i < fallback.length; i++) {
            //                 const { option, value } = fallback[i];
            //                 if (e) {
            //                     binder.data.push(value);
            //                 } else {
            //                     option.selected = true;
            //                 }
            //             }
            //         } else {
            //             // const { option, value } = fallback[0] || ctx.options[0];
            //             // if (e) {
            //             //     binder.data = value;
            //             // } else {
            //             //     option.selected = true;
            //             // }
            //         }
            //     }
            //
        };
    } else if (type === 'checkbox' || type === 'radio') {
        let data;
        return {
            async read () {
                data = await binder.data;
                data = await binder.display(data);
                console.log(data);
            },
            async write () {
                binder.target.value = data;
                binder.target.setAttribute('value', data);
            }
        };
    } else if (type === 'number') {
        return {
            read (ctx) {
                ctx.data = binder.data;
                ctx.value = toNumber(binder.target.value);
            },
            write (ctx) {
                ctx.value = toString(ctx.data);
                binder.target.value = ctx.value;
                binder.target.setAttribute('value', ctx.value);
                binder.meta.busy = false;
            }
        };
    } else if (type === 'file') {
        return {
            read (ctx) {
                ctx.data = binder.data;
                ctx.multiple = binder.target.multiple;
                ctx.value = ctx.multiple ? [...binder.target.files] : binder.target.files[0];
            }
        };
    } else {
        return {
            read (ctx) {
                // if (binder.target.nodeName === 'O-OPTION' || binder.target.nodeName === 'OPTION') return ctx.write = false;

                ctx.data = binder.data;
                ctx.value = binder.target.value;
                // ctx.match = match(ctx.data, ctx.value);
                // ctx.selected = binder.target.selected;

                // if (ctx.match) {
                //     binder.meta.busy = false;
                //     ctx.write = false;
                //     return;
                // }

                // if (
                //     binder.target.parentElement &&
                //     (binder.target.parentElement.type === 'select-one'||
                //     binder.target.parentElement.type === 'select-multiple')
                // ) {
                //     ctx.select = binder.target.parentElement;
                // } else if (
                //     binder.target.parentElement &&
                //     binder.target.parentElement.parentElement &&
                //     (binder.target.parentElement.parentElement.type === 'select-one'||
                //     binder.target.parentElement.parentElement.type === 'select-multiple')
                // ) {
                //     ctx.select = binder.target.parentElement.parentElement;
                // }
                //
                // if (ctx.select) {
                //     const attribute = ctx.select.attributes['o-value'] || ctx.select.attributes['value'];
                //     if (!attribute) return ctx.write = false;
                //     ctx.select = Binder.get(attribute);
                //     ctx.multiple = ctx.select.target.multiple;
                // }

            },
            write (ctx) {
                // const { select, selected, multiple } = ctx;

                // if (select) {
                //     if (multiple) {
                //         const index = Index(select.data, ctx.data);
                //         if (event) {
                //             if (selected && index === -1) {
                //                 select.data.push(ctx.data);
                //             } else if (!selected && index !== -1) {
                //                 select.data.splice(index, 1);
                //             }
                //         } else {
                //             if (index === -1) {
                //                 binder.target.selected = false;
                //             } else {
                //                 binder.target.selected = true;
                //             }
                //         }
                //     } else {
                //         const match = match(select.data, ctx.data);
                //         if (event) {
                //             // console.log(match);
                //             // console.log(select.data);
                //             // console.log(ctx.data);
                //             if (selected !== match) {
                //                 select.data = ctx.data;
                //                 // console.log(select.data);
                //                 // throw 'stop';
                //             }
                //         } else {
                //             if (match) {
                //                 binder.target.selected = true;
                //             } else {
                //                 binder.target.selected = false;
                //             }
                //         }
                //     }
                // }
                // select.meta.busy = false;

                binder.target.value = ctx.data ?? '';
                binder.meta.busy = false;
            }
        };
    }
}
