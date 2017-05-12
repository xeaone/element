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
