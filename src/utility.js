import Batcher from './batcher';

var Utility = {};

Utility.createBase = function (base) {
	base = base || '';

	if (base) {
		var element = document.head.querySelector('base');

		if (!element) {
			element = document.createElement('base');
			document.head.insertBefore(element, document.head.firstChild);
		}

		if (base && typeof base === 'string') {
			element.href = base;
		}

		base = element.href;
	}

	return base;
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
	var self = this, child;
	Batcher.write(function () {
		while (child = element.lastElementChild) {
			element.removeChild(child);
		}
	});
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

Utility.getContainer = function getContainer (element) {
	if (element.uid) {
		return element;
	} else {
		if (element !== document.body && element.parentElement) {
			return this.getContainer(element.parentElement);
		} else {
			console.warn('Utility could not find a uid');
			// throw new Error('Utility could not find a uid');
		}
	}
};

export default Utility;

// Utility.CAMEL = /-(\w)/g,
// Utility.toCamelCase = function (data) {
// 	return data.replace(this.CAMEL, function (match, next) {
// 		return next.toUpperCase();
// 	});
// }

// Utility.each = function (items, method, context) {
// 	return items.reduce(function (promise, item) {
// 		return promise.then(function () {
// 			return method.call(context, item);
// 		});
// 	}, Promise.resolve())

// };
