import Global from './global';

document.addEventListener('reset', function resetListener (e) {
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

document.addEventListener('submit', function submitListener (e) {
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

var style = document.createElement('style');

style.setAttribute('type', 'text/css');
style.appendChild(document.createTextNode('o-router, o-router > :first-child { display: block; }'));

document.head.appendChild(style);

var listener = function () {
	var element = document.querySelector('script[o-setup]');

	if (element) {
		var args = element.getAttribute('o-setup').split(/\s*,\s*/);
		Global.loader.load({
			url: args[0],
			method: args[2],
			transformer: args[1]
		});
	}

	document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});

}

if ('registerElement' in document && 'content' in document.createElement('template')) {
	listener();
} else {
	var polly = document.createElement('script');
	
	polly.setAttribute('type', 'text/javascript');
	polly.setAttribute('src', 'https://unpkg.com/oxe@2.9.9/dist/webcomponents-lite.min.js');
	polly.addEventListener('load', function () {
		listener();
		this.removeEventListener('load', listener);
	}, true);

	document.head.appendChild(polly);
}

export default Global;
