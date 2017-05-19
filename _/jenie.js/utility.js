
module.exports = {
	GET: 2,
	SET: 3,
	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},
	// router start
	has: function (string, search) {
		return string.indexOf(search) !== -1;
	},
	// view/model start
	toCamelCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	},
	toDashCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('');
		return data.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
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
	setByPath: function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0, key; i < last; i++) {
			key = keys[i];
			if (collection[key] === undefined) collection[key] = {};
			collection = collection[key];
		}

		return collection[keys[last]] = value;
	}
};
