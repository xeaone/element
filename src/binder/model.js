var Utility = require('./utility');

function Model () {}

Model.prototype.every = function (collection, callback, path) {
	var self = this, key, type;

	path = !path ? '' : path += '.';
	type = collection === null || collection === undefined ? collection : collection.constructor.name;

	if (type !== 'Array' && type !== 'Object') return;

	function action (c, k, p) {
		var v = c[k];
		callback(p, v, k, c);
		if (v && (v.constructor.name === 'Array' || v.constructor.name === 'Object')) {
			self.every(v, null, callback, p);
		}
	}

	if (type === 'Array') {
		if (collection.length === 0) return;
		for (key = 0; key < collection.length; key++) {
			action(collection, key, path + key);
		}
	} else if (type === 'Object') {
		for (key in collection) {
			action(collection, key, path + key);
		}
	}
};

Model.prototype.each = function (collection, callback) {
	var key;

	if (!collection) {
		throw new Error('not a collection');
	} else if (collection.constructor.name === 'Array') {
		if (collection.length === 0) return;
		for (key = 0; key < collection.length; key++) {
			callback(collection[key], key);
		}
	} else if (collection.constructor.name === 'Object') {
		if (Object.keys(collection).length === 0) return;
		for (key in collection) {
			callback(collection[key], key);
		}
	}
};

// Model.prototype.notify = function (path, collection, callback) {
// 	if (collection && (collection.constructor.name === 'Array' || collection.constructor.name === 'Object')) {
// 		this.every(collection, function (v, k, c, p) {
// 			callback(path + '.' + p, v);
// 		});
// 	}
// };

Model.prototype.ins = function (model, callback, prefix, key, value) {
	var self = this, type;

	type = model === null || model === undefined ? model : model.constructor.name;

	if (type === 'Object' || type === 'Array') {
		value = self.observe(value, callback, prefix + key, true);
	}

	model = Object.defineProperty(model, key, self.descriptor(prefix + key, value, callback));

	if (callback) callback(prefix + key, value);

	// if (model.constructor.name === 'Array' && key == -1) {
	// 	key = 0;
	// 	model.splice(key, 0, value);
	// 	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
	// 	key = model.length-1;
	// 	value = model[key];
	// }

};

Model.prototype.del = function (model, callback, path, key) {
	var self = this, type;

	type = model === null || model === undefined ? model : model.constructor.name;

	if (type === 'Array') {
		model.splice(key, 1);
		callback(path.slice(0, -1), model);
			// self.every(model[key], function (p) {
			// 	callback(path + key + '.' + p, undefined);
			// });

	} else if (type === 'Object') {
		self.every(model[key], function (v, k, c, p) {
			callback(path + key + '.' + p, undefined);
		});
		callback(path + key, undefined);
		delete model[key];
	}

};

Model.prototype.descriptor = function (path, value, callback) {
	var self = this;

	return {
		configurable: true,
		enumerable: true,
		get: function () {
			return value;
		},
		set: function (newValue) {
			value = newValue;

			self.every(value, function (p, v) {
				callback(path + '.' + p, v);
			});

			callback(path, value);
		}
	};
};

Model.prototype.observe = function (collection, callback, prefix, notify) {
	var self = this, properties = {}, data;

	prefix = !prefix ? '' : prefix += '.';
	data = collection.constructor.name === 'Object' ? {} : [];

	properties.ins = {
		value: self.ins.bind(self, data, callback, prefix)
	};

	properties.del = {
		value: self.del.bind(self, data, callback, prefix)
	};

	self.each(collection, function (value, key) {
		if (value !== null && value !== undefined) {
			if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
				value = self.observe(value, callback, prefix + key);
			}
		}

		properties[key] = self.descriptor(prefix + key, value, callback);

		if (callback && notify) callback(prefix + key, value);
	});

	return Object.defineProperties(data, properties);
};

Model.prototype.get = function (path) {
	return Utility.getByPath(this.data, path);
};

Model.prototype.set = function (path, data) {
	return Utility.setByPath(this.data, path, data);
};

Model.prototype.setup = function (collection, callback) {
	this.data = this.observe(collection, callback);
};

Model.prototype.create = function (options) {
	var self = this;
	options = options || {};
	self.data = options.data || {};
	return self;
};

module.exports = function (options) {
	return new Model().create(options);
};
