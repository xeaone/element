import INDEX from './index';

var Utility = {
	// CAMEL: /-(\w)/g,
	// toCamelCase: function (data) {
	// 	return data.replace(this.CAMEL, function (match, next) {
	// 		return next.toUpperCase();
	// 	});
	// },
	createBase: function (base) {
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
	},
	toText: function (data) {
		if (data === null || data === undefined) return '';
		if (typeof data === 'object') return JSON.stringify(data);
		else return String(data);
	},
	setByPath: function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			var key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	},
	getByPath: function (collection, path) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0; i < last; i++) {
			if (!collection[keys[i]]) return undefined;
			else collection = collection[keys[i]];
		}

		return collection[keys[last]];
	},
	removeChildren: function (element) {
		var self = this, child;
		INDEX.batcher.write(function () {
			while (child = element.lastElementChild) {
				element.removeChild(child);
			}
		});
	},
	joinSlash: function () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
	},
	joinDot: function () {
		return Array.prototype.join
			.call(arguments, '.')
			.replace(/\.{2,}/g, '.');
	},
	getContainer: function getContainer (element) {
		if (element.uid) {
			return element;
		} else {
			if (element !== document.body && element.parentElement) {
				return this.getContainer(element.parentElement);
			} else {
				throw new Error('Utility could not find a uid');
			}
		}
	},
	// each: function (items, method, context) {
	// 	return items.reduce(function (promise, item) {
	// 		return promise.then(function () {
	// 			return method.call(context, item);
	// 		});
	// 	}, Promise.resolve());
	// }
};

export default Utility;
