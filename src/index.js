import Global from './global.js';
import Wraper from './wraper.js';

var eStyle = document.createElement('style');
var tStyle = document.createTextNode(' \
	o-router, o-router > :first-child { \
		display: block; \
	} \
	o-router, [o-scope] { \
		animation: o-transition 150ms ease-in-out; \
	} \
	@keyframes o-transition { \
		0% { opacity: 0; } \
		100% { opacity: 1; } \
	} \
');

eStyle.setAttribute('type', 'text/css');
eStyle.appendChild(tStyle);

document.head.appendChild(eStyle);

let currentCount = 0;
let requiredCount = 0;
let loadedCalled = false;

const loaded = function () {
	if (loadedCalled) return;
	if (currentCount !== requiredCount) return;

	loadedCalled = true;

	document.addEventListener('reset', function resetListener (e) {
		var element = e.target;
		var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

		var binder = Global.binder.get({
			name: 'o-submit',
			element: element
		});

		var scope = binder.scope;

		if (submit) {
			var elements = element.querySelectorAll('[o-value]');
			var i = elements.length;

			while (i--) {
				var path = elements[i].getAttribute('o-value');
				var keys = [scope].concat(path.split('.'));

				Global.model.set(keys, '');

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

		if (!submit) return;

		e.preventDefault();

		var binder = Global.binder.get({
			name: 'o-submit',
			element: element
		});

		var sScope = binder.scope;
		var eScope = binder.container;
		var model = Global.model.data[sScope];

		var data = Global.utility.formData(element, model);
		var method = Global.utility.getByPath(eScope.methods, submit);

		var done = function (options) {
			if (options && typeof options === 'object') {
				var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
				var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
				var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
				var enctype = element.getAttribute('o-enctype') || element.getAttribute('data-o-enctype');

				options.url = options.url || action;
				options.method = options.method || method;
				options.auth = options.auth === undefined || options.auth === null ? auth : options.auth;
				options.contentType = options.contentType === undefined || options.contentType === null ? enctype : options.contentType;

				Global.fetcher.fetch(options);
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

		Wraper(method.bind(eScope, data, e), done);

	}, true);

	document.addEventListener('input', function (e) {
		if (
			e.target.type !== 'checkbox'
			&& e.target.type !== 'radio'
			&& e.target.type !== 'option'
			&& e.target.nodeName !== 'SELECT'
			&& e.target.hasAttribute('o-value')
		) {

			var binder = Global.binder.get({
				name: 'o-value',
				element: e.target,
			});

			Global.binder.render(binder);
		}
	}, true);

	document.addEventListener('change', function (e) {
		if (e.target.hasAttribute('o-value')) {

			var binder = Global.binder.get({
				name: 'o-value',
				element: e.target,
			});

			Global.binder.render(binder);
		}
	}, true);

	var element = document.querySelector('script[o-setup]');

	if (element) {

		var args = element.getAttribute('o-setup').split(/\s*,\s*/);
		var meta = document.querySelector('meta[name="oxe"]');

		if (meta && meta.hasAttribute('compiled')) {
			args[1] = 'null';
			args[2] = 'script';
			Global.compiled = true;
			Global.router.compiled = true;
			Global.component.compiled = true;
		}

		if (!args[0]) {
			throw new Error('Oxe - o-setup attribute requires a url');
		}


		if (args.length > 1) {
			Global.loader.load({
				url: args[0],
				method: args[2],
				transformer: args[1]
			});
		} else {
			var index = document.createElement('script');
			index.setAttribute('src', args[0]);
			index.setAttribute('async', 'true');
			index.setAttribute('type', 'module');
			element.insertAdjacentElement('afterend', index);
		}

	}

	document.registerElement('o-router', {
		prototype: Object.create(HTMLElement.prototype)
	});

};

const loader = function (condition, url) {
	if (condition) {
		requiredCount++;
		var polly = document.createElement('script');
		polly.setAttribute('async', 'true');
		polly.setAttribute('src', url);
		polly.addEventListener('load', function () {
			currentCount++;
			loaded();
		}, true);
		document.head.appendChild(polly);
	} else {
		loaded();
	}
};

let features = [];

const isNotFetch = !('fetch' in window);
const isNotAssign = !('assign' in Object);
const isNotPromise = !('Promise' in window);

if (isNotFetch) features.push('fetch');
if (isNotPromise) features.push('Promise');
if (isNotAssign) features.push('Object.assign');

loader(
	isNotPromise || isNotFetch || isNotAssign,
	'https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join(',')
);

loader(
	!('registerElement' in document) || !('content' in document.createElement('template')),
	'https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js'
);

export default Global;
