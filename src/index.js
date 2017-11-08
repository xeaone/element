import Global from './global';
import Utility from './utility';

if (window.Oxe) throw new Error('Oxe pre-defined duplicate Oxe scripts');

var Oxe = Global; // Object.defineProperties({}, Object.getOwnPropertyDescriptors(Global));


Oxe.window.addEventListener('input', function (e) {
	Oxe.inputs.forEach(function (input) {
		input(e);
	});
}, true);

Oxe.window.addEventListener('change', function (e) {
	Oxe.changes.forEach(function (change) {
		change(e);
	});
}, true);

Oxe.window.addEventListener('click', function (e) {
	Oxe.clicks.forEach(function (click) {
		click(e);
	});
}, true);

Oxe.window.addEventListener('popstate', function (e) {
	Oxe.popstates.forEach(function (popstate) {
		popstate(e);
	});
}, true);

Oxe.window.addEventListener('submit', function (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');
	var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
	var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');

	if (submit) {

		var container = Utility.getContainer(element);
		var data = Utility.formData(element, container.model);
		var handler = Utility.getByPath(container.events, submit);

		if (action) {
			Global.fetcher.fetch({
				data: data,
				url: action,
				method: method,
				handler: handler
			});
		} else {
			handler(data);
		}

		e.preventDefault();
	}
}, true);

new window.MutationObserver(function (mutations) {
	Oxe.mutations.forEach(function (mutation) {
		mutation(mutations);
	});
}).observe(Oxe.body, {
	childList: true,
	subtree: true
});

window.requestAnimationFrame(function () {
	var eStyle = Oxe.document.createElement('style');
	var sStyle = Oxe.document.createTextNode('o-view, o-view > :first-child { display: block; }');
	eStyle.setAttribute('title', 'Oxe');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	Oxe.head.appendChild(eStyle);
	Oxe.document.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
	var eScript = Oxe.document.querySelector('[o-index]')
	var eIndex = eScript ? eScript.getAttribute('o-index') : null;
	if (eIndex) Oxe.loader.load({ url: eIndex });
});

Oxe.view.run();
Oxe.model.run();

export default Oxe;
