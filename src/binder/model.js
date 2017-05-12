var Utility = require('../utility');
var Events = require('../events');

function Model () {}

Model.prototype = Object.create(Events.prototype);
Model.prototype.constructor = Model;

Model.prototype.join = function () {
	return Array.prototype.join
	.call(arguments, '.')
	.replace(/\.{2,}/g, '.')
	.replace(/^\.|\.$/g, '');
};

Model.prototype.each = function (data, callback, index) {
	Object.keys(data).slice(index).forEach(function (key) {
		callback.call(this, data[key], key, data);
	}, this);
};

Model.prototype.every = function (data, callback, index, emit, path) {
	if (Utility.isCollection(data)) {
		this.each(data, function (value, key) {
			this.every(value, callback, 0, true, this.join(path, key));
		}, index);
	}

	if (emit) callback.call(this, data, path || '');
};

Model.prototype.ins = function (data, key, value) {
	data._meta[key] = value;

	this.define(value, this.join(data._path, key), true);
	this.defineProperty(data, key);

	this.emit('*', this.join(data._path, key), value);
	this.emit('*', this.join(data._path), data);
};

Model.prototype.del = function (data, key) {
	if (Utility.is(data, 'Object')) {
		var item = data[key];
		delete data._meta[key];
		delete data[key];

		this.every(item, function (value, path) {
			path = this.join(data._path, key, path);
			this.emit('*', path, undefined);
		});

		this.emit('*', this.join(data._path, key), undefined);
	} else if (Utility.is(data, 'Array')) {
		data._meta.splice(key, 1);
		data.splice(data.length-1, 1);

		this.every(data, function (value, path) {
			path = this.join(data._path, path);

			// updateS _path to match index change
			if (Utility.isCollection(value)) value._path = path;
			this.emit('*', path, value);
		}, parseInt(key));

		this.emit('*', this.join(data._path, data.length), undefined);
		this.emit('*', this.join(data._path), data);
	}
};

Model.prototype.defineProperty = function (data, key) {
	Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return this._meta[key];
		},
		set: function (value) {
			if (value === undefined) {
				this.del(key);
			} else {
				this.ins(key, value);
			}
		}
	});
};

Model.prototype.define = function (data, path, emit) {
	if (!Utility.isCollection(data)) return;

	var self = this;

	Object.defineProperties(data, {
		_meta: {
			writable: true,
			configurable: true,
			value: data.constructor()
		},
		_path: {
			writable: true,
			configurable: true,
			value: path || ''
		},
		ins: {
			value: self.ins.bind(self, data)
		},
		del: {
			value: self.del.bind(self, data)
		}
	});

	Object.keys(data).forEach(function (key) {
		if (data[key] === undefined) return;

		data._meta[key] = data[key];

		this.define(data[key], this.join(path || '', key), emit);
		this.defineProperty(data, key);

		if (emit) this.emit('*', this.join(path || '', key), data[key]);
	}, this);

};

Model.prototype.get = function (path) {
	return Utility.getByPath(this.data, path);
};

Model.prototype.set = function (path, data) {
	return Utility.setByPath(this.data, path, data);
};

Model.prototype.setup = function (data) {
	this.data = data;
	this.define(this.data, null, true);
	return this;
};

Model.prototype.create = function () {
	this.events = {};
	return this;
};

module.exports = function (data) {
	return new Model().create(data);
};

// Model.prototype.every = function (collection, callback, path) {
// 	var self = this, key, type;
//
// 	path = !path ? '' : path += '.';
// 	type = collection === null || collection === undefined ? collection : collection.constructor.name;
//
// 	if (type !== 'Array' && type !== 'Object') return;
//
// 	function action (c, k, p) {
// 		var v = c[k];
// 		callback(p, v, k, c);
// 		if (v && (v.constructor.name === 'Array' || v.constructor.name === 'Object')) {
// 			self.every(v, null, callback, p);
// 		}
// 	}
//
// 	if (type === 'Array') {
// 		if (collection.length === 0) return;
// 		for (key = 0; key < collection.length; key++) {
// 			action(collection, key, path + key);
// 		}
// 	} else if (type === 'Object') {
// 		for (key in collection) {
// 			action(collection, key, path + key);
// 		}
// 	}
// };
//
// Model.prototype.each = function (collection, callback) {
// 	var key;
//
// 	if (!collection) {
// 		throw new Error('not a collection');
// 	} else if (collection.constructor.name === 'Array') {
// 		if (collection.length === 0) return;
// 		for (key = 0; key < collection.length; key++) {
// 			callback(collection[key], key);
// 		}
// 	} else if (collection.constructor.name === 'Object') {
// 		if (Object.keys(collection).length === 0) return;
// 		for (key in collection) {
// 			callback(collection[key], key);
// 		}
// 	}
// };
//
// // Model.prototype.notify = function (path, collection, callback) {
// // 	if (collection && (collection.constructor.name === 'Array' || collection.constructor.name === 'Object')) {
// // 		this.every(collection, function (v, k, c, p) {
// // 			callback(path + '.' + p, v);
// // 		});
// // 	}
// // };
//
// Model.prototype.ins = function (model, callback, prefix, key, value) {
// 	var self = this, type;
//
// 	type = model === null || model === undefined ? model : model.constructor.name;
//
// 	if (type === 'Object' || type === 'Array') {
// 		value = self.observe(value, callback, prefix + key, true);
// 	}
//
// 	model = Object.defineProperty(model, key, self.descriptor(prefix + key, value, callback));
//
// 	if (callback) callback(prefix + key, value);
//
// 	// if (model.constructor.name === 'Array' && key == -1) {
// 	// 	key = 0;
// 	// 	model.splice(key, 0, value);
// 	// 	model = Object.defineProperty(model, key, this.descriptor(prefix + key, value, callback));
// 	// 	key = model.length-1;
// 	// 	value = model[key];
// 	// }
//
// };
//
// Model.prototype.del = function (model, callback, path, key) {
// 	var self = this, type;
//
// 	type = model === null || model === undefined ? model : model.constructor.name;
//
// 	if (type === 'Array') {
// 		model.splice(key, 1);
// 		callback(path.slice(0, -1), model);
// 			// self.every(model[key], function (p) {
// 			// 	callback(path + key + '.' + p, undefined);
// 			// });
//
// 	} else if (type === 'Object') {
// 		self.every(model[key], function (v, k, c, p) {
// 			callback(path + key + '.' + p, undefined);
// 		});
// 		callback(path + key, undefined);
// 		delete model[key];
// 	}
//
// };
//
// Model.prototype.descriptor = function (path, value, callback) {
// 	var self = this;
//
// 	return {
// 		configurable: true,
// 		enumerable: true,
// 		get: function () {
// 			return value;
// 		},
// 		set: function (newValue) {
// 			value = newValue;
//
// 			self.every(value, function (p, v) {
// 				callback(path + '.' + p, v);
// 			});
//
// 			callback(path, value);
// 		}
// 	};
// };
//
// Model.prototype.observe = function (collection, callback, prefix, notify) {
// 	var self = this, properties = {}, data;
//
// 	prefix = !prefix ? '' : prefix += '.';
// 	data = collection.constructor.name === 'Object' ? {} : [];
//
// 	properties.ins = {
// 		value: self.ins.bind(self, data, callback, prefix)
// 	};
//
// 	properties.del = {
// 		value: self.del.bind(self, data, callback, prefix)
// 	};
//
// 	self.each(collection, function (value, key) {
// 		if (value !== null && value !== undefined) {
// 			if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
// 				value = self.observe(value, callback, prefix + key);
// 			}
// 		}
//
// 		properties[key] = self.descriptor(prefix + key, value, callback);
//
// 		if (callback && notify) callback(prefix + key, value);
// 	});
//
// 	return Object.defineProperties(data, properties);
// };
//
// Model.prototype.get = function (path) {
// 	return Utility.getByPath(this.data, path);
// };
//
// Model.prototype.set = function (path, data) {
// 	return Utility.setByPath(this.data, path, data);
// };
//
// Model.prototype.setup = function (collection, callback) {
// 	this.data = this.observe(collection, callback);
// };
//
// Model.prototype.create = function (options) {
// 	var self = this;
// 	options = options || {};
// 	self.data = options.data || {};
// 	return self;
// };
//
