import Router from '../router.js';

export default function (e) {

	// ignore canceled events, modified clicks, and right clicks
	if (e.button !== 0) return;
	if (e.defaultPrevented) return;
	if (e.target.nodeName === 'INPUT') return;
	if (e.target.nodeName === 'BUTTON') return;
	if (e.target.nodeName === 'SELECT') return;
	if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

	// if shadow dom use
	let target = e.path ? e.path[0] : e.target;
	let parent = target.parentNode;

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
		(Router.external.constructor.name === 'RegExp' && Router.external.test(target.href) ||
		Router.external.constructor.name === 'Function' && Router.external(target.href) ||
		Router.external.constructor.name === 'String' && Router.external === target.href)
	) return;

	if (Router.location.href !== target.href) {
		Router.route(target.href);
	}

	if (!Router.compiled) {
		e.preventDefault();
	}

}
