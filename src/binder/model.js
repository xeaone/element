var Utility = require('./utility');

function Model () {}

Model.prototype.ins = function (model, callback, prefix, key, value) {

	if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
		// could callback on each added here
		value = this.observe(value, callback, prefix + key, true);
	}

	// if (model.constructor.name === 'Array' && key == -1) {
	// 	key = 0;
	// 	model.splice(key, 0, value);
	// 	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
	// 	key = model.length-1;
	// 	value = model[key];
	// }

	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
	if (callback) callback(prefix.slice(0, -1), model);
	// if (callback) callback(prefix + key, value);
};

Model.prototype.del = function (model, callback, prefix, key) {
	if (model.constructor.name === 'Object') {
		delete model[key];
		if (callback) callback(prefix + key, undefined);
	} else if (model.constructor.name === 'Array') {
		// var l = model.length - 1;
		model.splice(key, 1);
		// key = l;
		if (callback) callback(prefix.slice(0, -1), model);
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

Model.prototype.descriptor = function (key, value, callback) {
	return {
		configurable: true,
		enumerable: true,
		get: function () {
			return value;
		},
		set: function (newValue) {
			value = newValue;
			callback(key, value);
		}
	};
};

Model.prototype.observe = function (collection, callback, prefix) {
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
