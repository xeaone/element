import Fetcher from '../fetcher.js';
import Binder from '../binder.js';

export default async function (event) {

    if (event.target.hasAttribute('o-submit') === false) {
        return;
    }

    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const type = element.type;

        if (
            !type && name !== 'TEXTAREA' ||
            type === 'submit' ||
            type === 'button' ||
			!type
        ) {
            continue;
        }

        const binder = Binder.get('attribute', element, 'o-value');
        const value = binder ? binder.data : element.value;
        const name = element.name || (binder ? binder.values[binder.values.length-1] : null);

        if (!name) continue;
        data[name] = value;

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
