import Global from './global.js';
import Change from './change.js';
import Submit from './submit.js';
import Reset from './reset.js';
import Input from './input.js';

// OPTIMIZE wait until polyfill are ready then allow setup

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

	document.addEventListener('input', Input, true);
	document.addEventListener('reset', Reset, true);
	document.addEventListener('submit', Submit, true);
	document.addEventListener('change', Change, true);

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

const features = [];
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
