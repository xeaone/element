import Model from '../model.js';
import Binder from '../binder.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default async function (event) {
	var element = event.target;
	var binder = Binder.elements.get(element).get('submit');
	var method = Methods.get(binder.keys);
	var model = Model.get(binder.scope);
	var data = Utility.formData(element, model);

	var options = await method.call(binder.container, data, event);

	if (typeof options === 'object') {
		var action = element.getAttribute('o-action');
		var method = element.getAttribute('o-method');
		var enctype = element.getAttribute('o-enctype');

		options.url = options.url || action;
		options.method = options.method || method;
		options.contentType = options.contentType || enctype;

		var result = await Fetcher.fetch(options);

		if (options.handler) {
			await options.handler(result);
		}

	}

	if (element.hasAttribute('o-reset') || (typeof options === 'object' && options.reset)) {
		element.reset();
	}

};
