import Fetcher from '../fetcher.js';
import Binder from '../binder.js';

export default async function (event) {

    if (event.target.hasAttribute('o-submit') === false) {
        return;
    }

    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');
    // const elements = event.target.querySelectorAll('[o-value], [value], select[name], input[name], textarea[name]');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const type = element.type;

        if (
            !type && name !== 'TEXTAREA' ||
            type === 'submit' ||
            type === 'button' ||
			!type
        // element.type === 'submit' ||
        // element.type === 'button' ||
        // element.nodeName === 'BUTTON' ||
        // element.nodeName === 'OPTION' ||
        // element.nodeName.indexOf('-BUTTON') !== -1 ||
        // element.nodeName.indexOf('-OPTION') !== -1
        ) {
            continue;
        }

        const binder = Binder.get('attribute', element, 'o-value');
        const value = binder ? binder.data : element.value;
        const name = element.name || (binder ? binder.values[binder.values.length-1] : i);

        if (!name) continue;
        data[name] = value;

        // if (name in data) {
        //     console.warn(`Oxe.submit - duplicate field name ${name}`);
        //     // if (typeof data[name] !== 'object') {
        //     //     data[name] = [ data[name] ];
        //     // }
        //     //
        //     // data[name].push(value);
        // } else {
        //     data[name] = value;
        // }

    }

    const submit = Binder.get('attribute', event.target, 'o-submit');
    const options = await submit.data.call(submit.container, data, event);

    if (typeof options === 'object') {

        options.url = options.url || event.target.getAttribute('o-action');
        options.method = options.method || event.target.getAttribute('o-method');
        options.contentType = options.contentType || event.target.getAttribute('o-enctype');

        const result = await Fetcher.fetch(options);

        if (options.handler) {
            await options.handler(result);
        }

    }

    if (event.target.hasAttribute('o-reset') || (typeof options === 'object' && options.reset)) {
        event.target.reset();
    }

}
