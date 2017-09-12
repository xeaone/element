
var Utility = {
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
	toCamelCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-(\w)/g, function (all, match) {
			return match.toUpperCase();
		});
	},
	removeChildren: function (element) {
		while (element.lastElementChild) {
			element.removeChild(element.lastElementChild);
		}
	},
	toText: function (data) {
		if (data === null || data === undefined) return '';
		if (typeof data === 'object') return JSON.stringify(data);
		else return String(data);
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
		console.log(element);
		if (!element.uid) {
			if (element === document.body) {
				throw new Error('could not find a uid');
			} else {
				return this.getContainer(element.parentElement);
			}
		} else {
			return element;
		}
	},
	each: function (items, method, context) {
		return items.reduce(function (promise, item) {
			return promise.then(function () {
				return method.call(context, item);
			});
		}, Promise.resolve());
	}
};

export default Utility;
