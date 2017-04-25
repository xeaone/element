
module.exports = {
	GET: 2,
	SET: 3,

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

	// ensureBoolean: function (value) {
	// 	if (typeof value === 'string') return value === 'true';
	// 	else return value;
	// },
	//
	// ensureString: function (value) {
	// 	if (typeof value === 'object') return JSON.stringify(value);
	// 	else return value.toString();
	// },

	/*
		object
	*/

	interact: function (type, collection, path, value) {
		// var keys = this.toCamelCase(path).split('.');
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

	/*
		DOM
	*/

	glance: function (element) {
		var attribute, glance = element.nodeName.toLowerCase();

		for (var i = 0, l = element.attributes.length; i < l; i++) {
			attribute = element.attributes[i];
			glance = glance + ' ' + attribute.name + '="' + attribute.value + '"';
		}

		return glance;
	},

	eachElement: function (elements, reject, skip, accept, callback) {
		for (var index = 0, element, glance; index < elements.length; index++) {
			element = elements[index];
			glance = this.glance(element);

			if (reject && reject.test(glance)) {
				index += element.children.length;
			} else if (skip && skip.test(glance)) {
				continue;
			} else if (accept && accept.test(glance)) {
				callback(element, index);
			}
		}
	}

};

// uid: function () {
// 	return Math.random().toString(36).substr(2, 9);
// },

// eachAttribute: function (attributes, pattern, callback) {
// 	for (var index = 0, attribute; index < attributes.length; index++) {
// 		attribute = {
// 			name: attributes[index].name,
// 			value: attributes[index].value,
// 			full: attributes[index].name + '="' + attributes[index].value + '"'
// 		};
//
// 		if (pattern && pattern.test(attribute.full)) {
// 			callback(attribute, index);
// 		}
// 	}
// },
