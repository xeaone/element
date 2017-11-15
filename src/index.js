import Utility from './lib/utility';
import Global from './global';

if (window.Oxe) {
	throw new Error('Oxe pre-defined duplicate Oxe scripts');
}

Global.window.addEventListener('input', function (e) {
	Global.inputs.forEach(function (input) {
		input(e);
	});
}, true);

Global.window.addEventListener('change', function (e) {
	Global.changes.forEach(function (change) {
		change(e);
	});
}, true);

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

Global.window.addEventListener('submit', function (e) {
	var element = e.target;
	var submit = element.getAttribute('o-submit') || element.getAttribute('data-o-submit');

	if (submit) {
		var isValid = true;
		var container = Utility.getContainer(element);
		var data = Utility.formData(element, container.model);
		var submitHandler = Utility.getByPath(container.events, submit);

		var validate = element.getAttribute('o-validate') || element.getAttribute('data-o-validate');
		if (validate) {
			var validateHandler = Utility.getByPath(container.events, validate);
			isValid = validateHandler.call(container.model, data, e);
		}

		if (isValid) {
			var action = element.getAttribute('o-action') || element.getAttribute('data-o-action');
			if (action) {
				var auth = element.getAttribute('o-auth') || element.getAttribute('data-o-auth');
				var method = element.getAttribute('o-method') || element.getAttribute('data-o-method');
				auth = auth === null || auth === undefined ? auth : (auth == 'true');
				Global.fetcher.fetch({
					data: data,
					auth: auth,
					url: action,
					method: method,
					handler: submitHandler.bind(container.model)
				});
			} else {
				submitHandler.call(container.model, data, e);
			}
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
