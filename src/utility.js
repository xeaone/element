
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
	}
};
