import Model from '../model.js';
import Binder from '../binder.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default function (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (!submit) return;
	else e.preventDefault();

	var binder = Binder.elements.get(element).get('submit');
	var method = Methods.get(binder.keys);
	var model = Model.get(binder.scope);

	var data = Utility.formData(element, model);

	Promise.resolve().then(async function () {
		
		var options = await method.call(binder.container, data, e);

		if (typeof options === 'object') {
			var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
			var enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

			options.url = options.url || action;
			options.method = options.method || method;
			options.contentType = options.contentType || enctype;

			var result = await Fetcher.fetch(options);

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
