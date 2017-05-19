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

Model.prototype.clone = function (data) {
	var collection = Object.create(Object.getPrototypeOf(data));

	Object.keys(data).forEach(function (key) {
		if (data[key] && typeof data[key] === 'object') {
			collection[key] = this.clone(data[key]);
		} else {
			Object.defineProperty(collection, key,
				Object.getOwnPropertyDescriptor(data, key)
			);
		}
	}, this);

	return collection;
};

Model.prototype.get = function (path) {
	var keys = path.split('.');
	var last = keys.length - 1;
	var collection = this.data;

	for (var i = 0; i < last; i++) {
		if (!collection[keys[i]]) return undefined;
		else collection = collection[keys[i]];
	}

	return collection[keys[last]];
};

Model.prototype.set = function (path, value) {
	var keys = path.split('.');
	var last = keys.length - 1;
	var collection = this.data;

	for (var i = 0, key; i < last; i++) {
		key = keys[i];
		if (collection[key] === undefined) collection[key] = {};
		collection = collection[key];
	}

	return collection[keys[last]] = value;
};

Model.prototype.ins = function (data, key, value) {
	data._meta[key] = value;

	data[key] = this.define(value, this.join(data._path, key), true);
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

			// update _path to match index change
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
	if (!Utility.isCollection(data)) return data;

	var value;
	var self = this;

	path = path || '';

	// clone
	var collection = data.constructor();

	Object.defineProperties(collection, {
		_meta: {
			// value: data,
			// writable: true,
			configurable: true,
			get: function () {
				return data;
			}
			// value: data.constructor()
		},
		_path: {
			writable: true,
			configurable: true,
			value: path || ''
		},
		ins: {
			value: self.ins.bind(self, collection)
		},
		del: {
			value: self.del.bind(self, collection)
		}
	});

	Object.keys(data).forEach(function (key) {
		value = data[key];

		if (value === undefined) return;

		// collection._meta[key] = value;
		collection[key] = this.define(value, this.join(path, key), emit);
		this.defineProperty(collection, key, path);

		if (emit) {
			this.emit('*', this.join(path || '', key), value);
		}

	}, this);

	// console.log(collection);

	return collection;
};

Model.prototype.setup = function (data) {
	this.data = this.define(data, null, true);
	return this;
};

Model.prototype.create = function () {
	this.events = {};
	return this;
};

module.exports = function (data) {
	return new Model().create(data);
};
