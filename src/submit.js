import Global from './global.js';

export default function (e) {
	let element = e.target;
	let submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (!submit) return;

	e.preventDefault();

	let binder = Global.binder.get({
		name: 'o-submit',
		element: element
	});

	let sScope = binder.scope;
	let eScope = binder.container;
	let model = Global.model.data[sScope];

	let data = Global.utility.formData(element, model);
	let method = Global.utility.getByPath(eScope.methods, submit);

	let done = async function (options) {

		if (options && typeof options === 'object') {
			let auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
			let action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			let method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
			let enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

			options.url = options.url || action;
			options.method = options.method || method;
			options.auth = options.auth === undefined || options.auth === null ? auth : options.auth;
			options.contentType = options.contentType === undefined || options.contentType === null ? enctype : options.contentType;

			await Global.fetcher.fetch(options);
		}

		if (
			(
				options &&
				typeof options === 'object' &&
				options.reset
			)
			|| element.hasAttribute('o-reset')
		) {
			element.reset();
		}
	};

	Promise.resolve()
	.then(method.bind(eScope, data, e))
	.then(done)
	.catch(console.error);
}
