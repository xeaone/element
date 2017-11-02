import Utility from './utility';
import Global from './global';

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

new window.MutationObserver(function (mutations) {
	Oxe.observers.forEach(function (observer) {
		observer(mutations);
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
