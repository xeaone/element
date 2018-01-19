import Global from './global';

Global.document.addEventListener('reset', function resetListener (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (submit) {
		var elements = element.querySelectorAll('[o-value]');
		var i = elements.length;

		while (i--) {
			Global.binder.unrender({
				name: 'o-value',
				element: elements[i]
			}, 'view');
		}

	}

}, true);

Global.document.addEventListener('submit', function submitListener (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (!submit) {
		return;
	}

	e.preventDefault();

	var container = Global.utility.getContainer(element);
	var scope = container.getAttribute('o-scope');
	var model = Global.model.data[scope];

	Global.utility.formData(element, model, function (data) {

		var method = Global.utility.getByPath(container.methods, submit);
		var options = method.call(model, data, e);

		if (options && typeof options === 'object') {
			var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
			var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');

			options.url = options.url || action;
			options.method = options.method || method;
			options.auth = options.auth === undefined ? auth : options.auth;

			Global.fetcher.fetch(options);
		}

		if (
			(
				options
				&& typeof options === 'object'
				&& options.reset
			)
			|| element.hasAttribute('o-reset')
		) {
			element.reset();
		}

	});

}, true);

var eStyle = Global.document.createElement('style');
var sStyle = Global.document.createTextNode('o-router, o-router > :first-child { display: block; }');

eStyle.appendChild(sStyle);
eStyle.setAttribute('title', 'Oxe');
eStyle.setAttribute('type', 'text/css');
Global.head.appendChild(eStyle);

var listener = function () {
	var eIndex = Global.document.querySelector('[o-index-url]');

	if (eIndex) {

		var url = eIndex.getAttribute('o-index-url');
		var method = eIndex.getAttribute('o-index-method');
		var transformer = eIndex.getAttribute('o-index-transformer');

		Global.loader.load({
			url: url,
			method: method,
			transformer: transformer
		});

	}

	Global.document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});
}

if ('registerElement' in Global.document && 'content' in Global.document.createElement('template')) {
	listener();
} else {
	Global.loader.load({
		method: 'script',
		url: 'https://unpkg.com/oxe@2.9.9/dist/webcomponents-lite.min.js',
	}, listener);
}

export default Global;
