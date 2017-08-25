
function Utility () {}

Utility.prototype.setByPath = function (collection, path, value) {
	var keys = path.split('.');
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];
		if (collection[key] === undefined) collection[key] = {};
		collection = collection[key];
	}

	return collection[keys[last]] = value;
};

Utility.prototype.getByPath = function (collection, path) {
	var keys = path.split('.');
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		if (!collection[keys[i]]) return undefined;
		else collection = collection[keys[i]];
	}

	return collection[keys[last]];
};

Utility.prototype.toCamelCase = function (data) {
	if (data.constructor.name === 'Array') data = data.join('-');
	return data.replace(/-[a-z]/ig, function (match) {
		return match[1].toUpperCase();
	});
};

export default new Utility();
