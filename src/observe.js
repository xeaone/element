
 var Utility = {

	is: function (variable, name) {
		return variable && variable.constructor.name === name;
	},

	// clone: function (object) {
	// 	if (object === null || typeof object !== 'object') return object;
	//
	// 	var data = object.constructor(), key;
	//
	// 	for (key in object) {
	// 		data[key] = this.clone(object[key]);
	// 	}
	//
	// 	return data;
	// }

};

function Model () {}

Model.prototype.ins = function (data, callback, path, key, value) {
	var self = this;

	path += key.toString();

	if (Utility.is(value, 'Object') || Utility.is(value, 'Array')) {
		self.addListeners(value, callback, path, true);
	}

	self.defineProperty(data, key, path, callback);
	data.meta[key] = value;
	callback(path, value);

	return data[key];
};

Model.prototype.del = function (data, callback, path, key) {
	var self = this;

	if (Utility.is(data.meta, 'Object')) {
		delete data.meta[key];
		delete data[key];
		self.removeListeners(data.meta[key], callback, path + key.toString());
	} else if (Utility.is(data.meta, 'Array')) {
		var length = data.meta.length;
		var lastIndex = length === 0 ? 0 : length - 1;
		var lastItem = data.meta[lastIndex];

		data.meta.splice(key, 1);

		data.forEach(function (value, index, array) {
			array[index] = value;
		});

		data.splice(lastIndex, 1); // should go here but infinit loop

		self.removeListeners(lastItem, callback, path + lastIndex.toString());
	}

	return undefined;
};

Model.prototype.defineProperty = function (data, key, path, callback) {
	var self = this;

	return Object.defineProperty(data, key, {
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
	});
};

Model.prototype.removeListeners = function (data, callback, path) {
	if (!Utility.is(data, 'Object') && !Utility.is(data, 'Array')) {
		return callback(path, undefined);
	}

	var self = this;
	path = path ? path += '.' : '';

	Object.keys(data).forEach(function (key) {
		if (Utility.is(data[key], 'Object') || Utility.is(data[key], 'Array')) {
			self.removeListeners(data[key], callback, path + key);
		}

		callback(path + key, undefined);
	});
};

Model.prototype.addListeners = function (data, callback, path, notify) {
	var self = this;

	path = path ? path += '.' : '';

	// if (!data.meta) {
	//
	// }

	Object.defineProperty(data, 'meta', {
		writable: true,
		configurable: true,
		value: data.constructor()
	});

	if (!data.ins) {
		Object.defineProperty(data, 'ins', {
			value: self.ins.bind(self, data, callback, path)
		});
	}

	if (!data.del) {
		Object.defineProperty(data, 'del', {
			value: self.del.bind(self, data, callback, path)
		});
	}

	Object.keys(data).forEach(function (key) {
		var value = data[key];

		if (value !== undefined) {


			if (Utility.is(value, 'Object') || Utility.is(value, 'Array')) {
				self.addListeners(value, callback, path + key, notify);
			}

			self.defineProperty(data, key, path, callback);
			data.meta[key] = value;

			if (notify) {
				callback(path + key, data.meta[key]);
			}

		}
	});

	return data;
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
	a: [0, 1, 2, 3, { num: 4 }],
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
