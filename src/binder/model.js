
function Model () {}

Model.prototype.ins = function (model, callback, prefix, key, value) {

	if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
		value = this.create(value, callback, prefix + key, true);
	}

	if (model.constructor.name === 'Array' && key == -1) {
		key = 0;
		model.splice(key, 0, value);
		model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
		key = model.length-1;
		value = model[key];
	}

	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));

	if (callback) callback(prefix + key, value);
};

Model.prototype.del = function (model, callback, prefix, key) {
	if (model.constructor.name === 'Object') {
		delete model[key];
	} else if (model.constructor.name === 'Array') {
		var l = model.length - 1;
		model.splice(key, 1);
		key = l;
	}

	if (callback) callback(prefix + key, undefined);
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

Model.prototype.create = function (collection, callback, prefix) {
	var self = this, model, key, value;

	prefix = !prefix ? '' : prefix += '.';
	model = collection.constructor.name === 'Object' ? {} : [];

	model = Object.defineProperty(model, 'ins', {
		value: self.ins.bind(self, model, callback, prefix)
	});

	model = Object.defineProperty(model, 'del', {
		value: self.del.bind(self, model, callback, prefix)
	});

	for (key in collection) {
		value = collection[key];

		if (value.constructor.name === 'Object' || value.constructor.name === 'Array') value = self.create(value, callback, prefix + key);
		model = Object.defineProperty(model, key, self.descriptor(prefix + key, value, callback));

		// triggered on create
		if (callback) callback(prefix + key, value);
	}

	return model;
};

module.exports = function (collection, callback) {
	return new Model().create(collection, callback);
};
