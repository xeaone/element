
 var Utility = {

	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},

	clone: function (object) {
		if (object === null || typeof object !== 'object') return object;

		var data = object.constructor(), key;

		for (key in object) {
			data[key] = this.clone(object[key]);
		}

		return data;
	}

};

function Model () {}

Model.prototype.ins = function (data, callback, path, key, value) {
	var self = this;

	path += key;

	if (Utility.is(value, 'Object') || Utility.is(value, 'Array')) {
		data[key] = self.observer(value, callback, path, true);
	} else {
		Object.defineProperty(data, key, self.property(key, path, callback))
	}

	data.meta[key] = value;
	callback(path, value);

	return data[key];
};

Model.prototype.del = function (data, callback, path, key) {
	var self = this;

	path += key;

	if (Utility.is(data.meta, 'Object')) {
		delete data.meta[key];
		delete data[key];
	} else if (Utility.is(data.meta, 'Array')) {
		// console.log(data.meta);
		// console.log(data);
		// if (Utility.is(data.meta[key], 'Object') || Utility.is(data.meta[key], 'Array')) {
		// 	self.removeListeners(data.meta[key], callback, path);
		// }
		data.meta.splice(key, 1);
		delete data[key];
		data.splice(key, 1);
	}

	callback(path, undefined);

	return undefined;
};

Model.prototype.property = function (key, path, callback) {
	var self = this;

	return {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.meta[key];
		},
		set: function (value) {
			if (value === undefined) {
				self.del(this, callback, path, key, value);
			} else {
				self.ins(this, callback, path, key, value);
			}
		}
	};
};

Model.prototype.properties = function (data, callback, path, notify) {
	var self = this;

	path = path ? path += '.' : '';

	var properties = {
		meta: {
			writable: true,
			configurable: true,
			value: data.constructor()
		},
		ins: {
			value: self.ins.bind(self, data, callback, path)
		},
		del: {
			value: self.del.bind(self, data, callback, path)
		}
	};

	Object.keys(data).forEach(function (key) {
		var value = data[key];

		if (value !== undefined) {

			if (Utility.is(value, 'Object') || Utility.is(value, 'Array')) {
				Object.defineProperties(value, self.properties(value, callback, path + key, notify));
			}

			properties.meta.value[key] = value;
			properties[key] = self.property(key, path, callback);

			if (notify) {
				callback(path + key, value);
			}

		}
	});

	return properties;
};

Model.prototype.removeListeners = function (data, callback, path) {
	var self = this;
	path = path ? path += '.' : '';

	Object.keys(data).forEach(function (key) {
		if (Utility.is(data[key], 'Object') || Utility.is(data[key], 'Array')) {
			self.removeListeners(data[key], callback, path + key);
		}

		callback(path + key, undefined);
	});
};

Model.prototype.addListeners = function (data, callback) {
	var self = this;
	var properties = self.properties(data, callback);
	return Object.defineProperties(data, properties);
};

Model.prototype.setup = function (data, callback) {
	var self = this;
	self.data = self.addListeners(data, callback);
	return self;
};
//
// Model.prototype.create = function (options) {
// 	var self = this;
// 	options = options || {};
// 	self.data = options.data || {};
// 	return self;
// };

// module.exports = function (options) {
// 	return new Model().create(options);
// };

var object = {
	o: { zero: '0', hello: 'test' },
	a: [0, 1, 2 , 3, 4],
	n: null
};

var model = new Model().setup(object, function (path, value) {
	console.log(path);
	console.log(value);
	console.log('\n');
}).data;

// model.o.hello = 'wolrd';
// model.o.zero = undefined;
// console.log(model.o);
// console.log('\n');

// model.a[0] = undefined;
// console.log(model.a);
// console.log('\n');

// model.n = 1;
// console.log(model);
// console.log('\n');
