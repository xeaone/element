import Router from '../router.js';

export default function (event) {

	// ignore canceled events, modified clicks, and right clicks
	if (
		event.button !== 0 ||
		event.defaultPrevented ||
		event.target.nodeName === 'INPUT' ||
		event.target.nodeName === 'BUTTON' ||
		event.target.nodeName === 'SELECT' ||
		event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
	) {
		return;
	}

	// if shadow dom use
	var target = event.path ? event.path[0] : event.target;
	var parent = target.parentNode;

	if (Router.contain) {

		while (parent) {

			if (parent.nodeName === 'O-ROUTER') {
				break;
			} else {
				parent = parent.parentNode;
			}

		}

		if (parent.nodeName !== 'O-ROUTER') {
			return;
		}

	}

	// ensure target is anchor tag
	while (target && 'A' !== target.nodeName) {
		target = target.parentNode;
	}

	if (!target || 'A' !== target.nodeName) {
		return;
	}

	// check non-acceptables
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
	if (Router.external &&
		(Router.external.constructor === RegExp && Router.external.test(target.href) ||
		Router.external.constructor === Function && Router.external(target.href) ||
		Router.external.constructor === String && Router.external === target.href)
	) return;

	event.preventDefault();

	if (Router.location.href !== target.href) {
		Router.route(target.href).catch(console.error);
	}

};
