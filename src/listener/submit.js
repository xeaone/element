import Model from '../model.js';
import View from '../view.js';
import Utility from '../utility.js';
import Fetcher from '../fetcher.js';
import Methods from '../methods.js';

export default async function (event) {

	let node = event.target;
	let binder = View.get(node, 'submit');
	let method = Methods.get(binder.keys);
	let model = Model.get(binder.scope);
	let data = Utility.formData(node, model);

	let options = await method.call(binder.container, data, event);

	if (typeof options === 'object') {
		let oaction = node.getAttribute('o-action');
		let omethod = node.getAttribute('o-method');
		let oenctype = node.getAttribute('o-enctype');

		options.url = options.url || oaction;
		options.method = options.method || omethod;
		options.contentType = options.contentType || oenctype;

		let result = await Fetcher.fetch(options);

		if (options.handler) {
			await options.handler(result);
		}

	}

	if (node.hasAttribute('o-reset') || (typeof options === 'object' && options.reset)) {
		node.reset();
	}

};
