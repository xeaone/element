import Global from './global';

Global.document.addEventListener('click', function clickListener (e) {

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
		var parent = target.parentNode;

		if (Global.router.container) {

			while (parent) {

				if (parent === Global.router.container) {
					break;
				} else {
					parent = parent.parentNode;
				}

			}

			if (parent !== Global.router.container) {
				return;
			}

		}

		if (e.metaKey || e.ctrlKey || e.shiftKey) {
			return;
		}

		// ensure target is anchor tag
		while (target && 'A' !== target.nodeName) {
			target = target.parentNode;
		}

		if (!target || 'A' !== target.nodeName) {
			return;
		}

		// check non acceptables
		if (target.hasAttribute('download') ||
			target.hasAttribute('external') ||
			target.hasAttribute('o-external') ||
			target.href.indexOf('tel:') === 0 ||
			target.href.indexOf('ftp:') === 0 ||
			target.href.indexOf('file:') === 0 ||
			target.href.indexOf('mailto:') === 0 ||
			target.href.indexOf(window.location.origin) !== 0
		) return;

		// if external is true then default action
		if (Global.router.external &&
			(Global.router.external.constructor.name === 'RegExp' && Global.router.external.test(target.href) ||
			Global.router.external.constructor.name === 'Function' && Global.router.external(target.href) ||
			Global.router.external.constructor.name === 'String' && Global.router.external === target.href)
		) return;

		e.preventDefault();

		if (Global.router.location.href !== target.href) {
			Global.router.navigate(target.href);
		}

}, true);

Global.document.addEventListener('input', function inputListener (e) {

	if (
		e.target.type !== 'checkbox'
		&& e.target.type !== 'radio'
		&& e.target.type !== 'option'
		&& e.target.nodeName !== 'SELECT'
	) {
		Global.binder.render({
			name: 'o-value',
			element: e.target,
		}, 'view');
	}

}, true);

Global.document.addEventListener('change', function changeListener (e) {
	Global.binder.render({
		name: 'o-value',
		element: e.target,
	}, 'view');
}, true);

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
	var uid = container.getAttribute('o-uid');
	var model = Global.model.data[uid];

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

Global.window.addEventListener('popstate', function popstateListener (e) {
	var options = { replace: true };
	Global.router.navigate(e.state || window.location.href, options);
}, true);

new Global.window.MutationObserver(function mutationListener (mutations) {
	var c, i = mutations.length;

	while (i--) {
		var target = mutations[i].target;
		var addedNodes = mutations[i].addedNodes;
		var removedNodes = mutations[i].removedNodes;

		c = addedNodes.length;

		while (c--) {
			var addedNode = addedNodes[c];

			// if (addedNode.nodeType === 1) {
			// 	Global.view.add(addedNode);
			// }

			if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {

				if (addedNode.isRouterComponent) {
					addedNode.inRouterCache = true;
				}

				Global.view.add(addedNode);
			}

		}

		c = removedNodes.length;

		while (c--) {
			var removedNode = removedNodes[c];

			// if (removedNode.nodeType === 1) {
			// 	Global.view.remove(removedNode, target);
			// }

			if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {

				if (removedNode.isRouterComponent) {
					removedNode.inRouterCache = true;
				}

				Global.view.remove(removedNode, target);
			}

		}

	}

}).observe(Global.body, {
	childList: true,
	subtree: true
});

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
