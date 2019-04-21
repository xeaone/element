import Fetcher from '../fetcher.js';
import Methods from '../methods.js';
import Binder from '../binder.js';

export default async function (event) {

    const data = {};
    const elements = event.target.querySelectorAll('[o-value], [value]:not(button), select[name], input[name], textarea[name]');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];

        if (
            element.type === 'submit' ||
            element.type === 'button' ||
            element.nodeName === 'BUTTON' ||
            element.nodeName === 'OPTION' ||
            element.nodeName.indexOf('-BUTTON') !== -1 ||
            element.nodeName.indexOf('-OPTION') !== -1
        ) {
            continue;
        }

        const binder = Binder.get('attribute', element, 'o-value');
        const value = binder ? binder.data : element.value;

        if (name in data) {

            if (typeof data[name] !== 'object') {
                data[name] = [ data[name] ];
            }

            data[name].push(value);
        } else {
            data[name] = value;
        }

    }

    const submit = Binder.get('attribute', event.target, 'o-submit');
    const method = Methods.get(submit.keys);
    const options = await method.call(submit.container, data, event);

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
