import { toString } from '../tool';

const booleans = [
    'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'compact', 'controls', 'declare', 'default',
    'defaultchecked', 'defaultmuted', 'defaultselected', 'defer', 'disabled', 'draggable', 'enabled', 'formnovalidate',
    'indeterminate', 'inert', 'ismap', 'itemscope', 'loop', 'multiple', 'muted', 'nohref', 'noresize', 'noshade', 'hidden',
    'novalidate', 'nowrap', 'open', 'pauseonexit', 'readonly', 'required', 'reversed', 'scoped', 'seamless', 'selected',
    'sortable', 'spellcheck', 'translate', 'truespeed', 'typemustmatch', 'visible'
];

export default function (binder) {
    let data, result, boolean;
    return {
        async read () {
            // data = await binder.data;
            data = await binder.expression();
            boolean = booleans.includes(binder.type);

            // console.log(binder, data);

            if (boolean) {
                data = data ? true : false;
                // } else {
                // data = data === null || data === undefined ? '' : data;
                // data = binder.display(data);
            } else {
                data = toString(data);
            }
            // else if (typeof data === 'boolean') {
            //     console.log(binder.key);
            //     result = data ? binder.key : '';
            // }

        },
        async write () {
            binder.target[ binder.type ] = result;

            if (boolean) {
                if (data) binder.target.setAttribute(binder.type, '');
                else binder.target.removeAttribute(binder.type);
            } else {
                binder.target.setAttribute(binder.type, data);
            }

        }
    };
}
