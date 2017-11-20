import OnceBinder from './lib/once-binder';
import Utility from './lib/utility';
import Global from './global';

if (window.Oxe) {
	throw new Error('Oxe pre-defined duplicate Oxe scripts');
}

Global.window.addEventListener('click', function (e) {
	Global.clicks.forEach(function (click) {
		click(e);
	});
}, true);

Global.window.addEventListener('popstate', function (e) {
	Global.popstates.forEach(function (popstate) {
		popstate(e);
	});
}, true);

Global.window.addEventListener('input', function (e) {
	if (
		e.target.type !== 'checkbox'
		&& e.target.type !== 'radio'
		&& e.target.nodeName !== 'SELECT'
	) {
		OnceBinder.render({
			caller: 'view',
			name: 'o-value',
			element: e.target,
		});
	}
}, true);

Global.window.addEventListener('change', function (e) {
	OnceBinder.render({
		caller: 'view',
		name: 'o-value',
		element: e.target,
	});
}, true);

Global.window.addEventListener('reset', function (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
	if (submit) {
		var container = Utility.getContainer(element);
		var uid = container.getAttribute('o-uid');
		var model = Global.model.data[uid];
		Utility.formReset(element, model);
	}
});

Global.window.addEventListener('submit', function (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
	if (submit) {
		var container = Utility.getContainer(element);
		var uid = container.getAttribute('o-uid');
		var model = Global.model.data[uid];
		var data = Utility.formData(element, model);
		var method = Utility.getByPath(container.events, submit);
		var options = method.call(model, data, e);

		if (options && typeof options === 'object') {
			var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
			options.url = options.url || action;
			options.method = options.method || method;
			Global.fetcher.fetch(options);
		}

		if (element.hasAttribute('o-reset')) {
			element.reset();
		}

		e.preventDefault();
	}
}, true);

new window.MutationObserver(function (mutations) {
	Global.mutations.forEach(function (mutation) {
		mutation(mutations);
	});
}).observe(Global.body, {
	childList: true,
	subtree: true
});

window.requestAnimationFrame(function () {
	var eStyle = Global.document.createElement('style');
	var sStyle = Global.document.createTextNode('o-view, o-view > :first-child { display: block; }');
	eStyle.setAttribute('title', 'Oxe');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	Global.head.appendChild(eStyle);
	Global.document.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
	var eScript = Global.document.querySelector('[o-index]')
	var eIndex = eScript ? eScript.getAttribute('o-index') : null;
	if (eIndex) Global.loader.load({ url: eIndex });
});

Global.view.setup();
Global.model.setup();

export default Global;
