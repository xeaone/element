import Model from '../model.js';
import Binder from '../binder.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default function (e) {
	let element = e.target;
	let submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (!submit) return;
	else e.preventDefault();

	let binder = Binder.elements.get(element).get('submit');
	let method = Methods.get(binder.keys);
	let model = Model.get(binder.scope);

	let data = Utility.formData(element, model);

	Promise.resolve().then(async function () {
		
		let options = await method.call(binder.container, data, e);

		if (typeof options === 'object') {
			let action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			let method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
			let enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

			options.url = options.url || action;
			options.method = options.method || method;
			options.contentType = options.contentType || enctype;

			let result = await Fetcher.fetch(options);

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

	}).catch(console.error);

};
