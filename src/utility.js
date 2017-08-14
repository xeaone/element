
export default {

	PATH: /\s?\|(.*?)$/,
	PREFIX: /(data-)?j-/,
	MODIFIERS: /^(.*?)\|\s?/,

	setByPath: function (collection, path, value) {
		var keys = path.split('.');
		var last = keys.length - 1;

		for (var i = 0, key; i < last; i++) {
			key = keys[i];
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
		return data.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	},

	attribute: function (name, value) {
		var attribute = {};
		attribute.name = name;
		attribute.value = value;
		attribute.path = attribute.value.replace(this.PATH, '');
		attribute.opts = attribute.path.split('.');
		attribute.command = attribute.name.replace(this.PREFIX, '');
		attribute.cmds = attribute.command.split('-');
		attribute.key = attribute.opts.slice(-1);
		attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');
		return attribute;
	},

	each: function (array, method, context) {
		method = method.bind(context);
		for (var i = 0, l = array.length; i < l; i++) {
			method(array[i], i, array);
		}
		return array;
	},

};
