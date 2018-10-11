import Model from '../model.js';
import Binder from '../binder.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default async function (e) {
	const element = e.target;
	const submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (!submit) return;
	else e.preventDefault();

	const binder = Binder.elements.get(element).get('submit');
	const method = Methods.get(binder.keys);
	const model = Model.get(binder.scope);

	const data = Utility.formData(element, model);

	const options = await method.call(binder.container, data, e);

	if (typeof options === 'object') {
		const action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
		const method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
		const enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

		options.url = options.url || action;
		options.method = options.method || method;
		options.contentType = options.contentType || enctype;

		const result = await Fetcher.fetch(options);

		if (options.handler) {
			await options.handler(result);
		}

	}

	if (
		typeof options === 'object' && options.reset
		|| element.hasAttribute('o-reset')
		|| element.hasAttribute('data-o-reset')
	) {
		element.reset();
	}

};
