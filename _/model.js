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

	if (Utility.isCollection(value)) {
		this.define(data[key], value, this.join(data._path, key), true);
	}

	if (data[key] === undefined) {
		this.defineProperty(data, key);
	}

	this.emit('change', this.join(data._path, key), data[key]);
	this.emit('change', this.join(data._path), data);
};

Model.prototype.del = function (data, key) {
	if (Utility.is(data, 'Object')) {
		var item = data[key];
		delete data._meta[key];
		delete data[key];

		this.every(item, function (value, path) {
			path = this.join(data._path, key, path);
			this.emit('change', path, undefined);
		});

		this.emit('change', this.join(data._path, key), undefined);
	} else if (Utility.is(data, 'Array')) {
		data._meta.splice(key, 1);
		data.splice(data.length-1, 1);

		this.every(data, function (value, path) {
			path = this.join(data._path, path);

			// update _path to match index change
			if (Utility.isCollection(value)) value._path = path;
			this.emit('change', path, value);
		}, parseInt(key));

		this.emit('change', this.join(data._path, data.length), undefined);
		this.emit('change', this.join(data._path), data);
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
			this._meta[key] = value;

			if (value === undefined) {
				this.del(key);
			} else {
				this.ins(key, value);
			}
		}
	});
};

Model.prototype.define = function (target, source, path, emit) {
	path = path || '';
	// target = target || source.constructor();
	// console.log(source);

	Object.defineProperties(target, {
		_meta: {
			value: source.constructor(),
			// writable: true,
			configurable: true,
			// get: function () {
			// 	return source;
			// }
		},
		_path: {
			value: path,
			// writable: true,
			configurable: true
		},
		ins: {
			value: this.ins.bind(this, target)
		},
		del: {
			value: this.del.bind(this, target)
		}
	});

	Object.keys(source).forEach(function (key) {
		if (source[key] !== undefined) {

			if (Utility.isCollection(source[key])) {
				target[key] = source[key].constructor();
				this.define(target[key], source[key], this.join(path, key), emit);
				target._meta[key] = target[key];
			} else {
				target._meta[key] = source[key];
			}

			this.defineProperty(target, key);

			if (emit) {
				this.emit('change', this.join(path || '', key), target[key]);
			}

		}
	}, this);

	console.log(source);
	return target;
};

Model.prototype.setup = function (data) {
	this.data = data.constructor();
	this.define(this.data, data);
	return this;
};

Model.prototype.create = function () {
	this.events = {};
	return this;
};

module.exports = function (data) {
	return new Model().create(data);
};