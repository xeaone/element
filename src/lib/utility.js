
var Utility = {};

Utility.createBase = function (base) {
	var element = document.head.querySelector('base');

	if (!element) {
		element = document.createElement('base');
		document.head.insertBefore(element, document.head.firstChild);
	}

	if (typeof base === 'string') {
		element.href = base;
	}

	base = element.href;

	return base;
};

Utility.formData = function (form, model) {
	var elements = form.querySelectorAll('[o-value]');
	var data = {};

	for (var i = 0, l = elements.length; i < l; i++) {
		var element = elements[i];
		var path = element.getAttribute('o-value');
		var name = path.split('.').slice(-1);
		data[name] = Utility.getByPath(model, path);
	}

	return data;
};

Utility.toText = function (data) {
	if (data === undefined) return ''; // data === null ||
	if (typeof data === 'object') return JSON.stringify(data);
	else return String(data);
};

Utility.setByPath = function (collection, path, value) {
	var keys = path.split('.');
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];
		if (collection[key] === undefined) collection[key] = {};
		collection = collection[key];
	}

	return collection[keys[last]] = value;
};

Utility.getByPath = function (collection, path) {
	var keys = path.split('.');
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		if (!collection[keys[i]]) return undefined;
		else collection = collection[keys[i]];
	}

	return collection[keys[last]];
};

Utility.removeChildren = function (element) {
	var child;
	while (child = element.lastElementChild) {
		element.removeChild(child);
	}
};

Utility.joinSlash = function () {
	return Array.prototype.join
		.call(arguments, '/')
		.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
};

Utility.joinDot = function () {
	return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.');
};

Utility.getContainer = function getContainer (element, target) {

	if (element === document.body || element.nodeName === 'O-VIEW') {
		return;
	}

	if (element.hasAttribute('o-uid')) {
		return element;
	}

	if (element.parentElement) {
		return this.getContainer(element.parentElement, target);
	}

	if (target) {
		return this.getContainer(target);
	}

	console.warn('Utility could not find a uid');
};

export default Utility;
