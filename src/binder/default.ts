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
            data = await binder.compute();
            boolean = booleans.includes(binder.name);

            if (boolean) {
                data = data ? true : false;
            } else {
                data = toString(data);
            }

        },
        async write () {
            binder.target[ binder.name ] = result;

            if (boolean) {
                if (data) binder.target.setAttribute(binder.name, '');
                else binder.target.removeAttribute(binder.name);
            } else {
                binder.target.setAttribute(binder.name, data);
            }

        }
    };
}
