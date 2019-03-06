import Model from '../model.js';
import View from '../view.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default async function (event) {

	var element = event.target;
	var binder = View.get(element, 'submit');
	var method = Methods.get(binder.keys);
	var model = Model.get(binder.scope);
	var data = Utility.formData(element, model);

	var options = await method.call(binder.container, data, event);

	if (typeof options === 'object') {
		var oaction = element.getAttribute('o-action');
		var omethod = element.getAttribute('o-method');
		var oenctype = element.getAttribute('o-enctype');

		options.url = options.url || oaction;
		options.method = options.method || omethod;
		options.contentType = options.contentType || oenctype;

		var result = await Fetcher.fetch(options);

		if (options.handler) {
			await options.handler(result);
		}

	}

	if (element.hasAttribute('o-reset') || (typeof options === 'object' && options.reset)) {
		element.reset();
	}

};
