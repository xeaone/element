
module.exports = {
	GET: 2,
	SET: 3,

	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},

	isCollection: function (variable) {
		return variable !== null && typeof variable === 'object';
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

	interact: function (type, collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;
		var temporary = collection;

		for (var i = 0; i < last; i++) {
			var property = keys[i];

			if (temporary[property] === null || temporary[property] === undefined) {
				if (type === this.GET) {
					return undefined;
				} else if (type === this.SET) {
					temporary[property] = {};
				}
			}

			temporary = temporary[property];
		}

		if (type === this.GET) {
			return temporary[keys[last]];
		} else if (type === this.SET) {
			temporary[keys[last]] = value;
			return collection;
		}
	},

	getByPath: function (collection, path) {
		return this.interact(this.GET, collection, path);
	},

	setByPath: function (collection, path, value) {
		return this.interact(this.SET, collection, path, value);
	},
	// view/model end

};
