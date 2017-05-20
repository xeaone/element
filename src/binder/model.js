var Utility = require('../utility');
var Events = require('../events');

function Model () {
	Events.call(this);
}

Model.prototype = Object.create(Events.prototype);
Model.prototype.constructor = Model;

Model.prototype.join = function () {
	return Array.prototype.join
	.call(arguments, '.')
	.replace(/\.{2,}/g, '.')
	.replace(/^\.|\.$/g, '');
};

Model.prototype.isCollection = function (data) {
	return data && (data.constructor.name === 'Object' || data.constructor.name === 'Array');
};

Model.prototype.defineSplice = function (path, data, argument) {
	var self = this;

	Array.prototype.slice.call(argument, 2).forEach(function (value) {

		if (self.isCollection(value)) value = self.observeCollection(path, value);
		Array.prototype.splice.call(data.meta, argument[0], argument[1], value);
		self.observeProperty(path, data, data.meta.length-1);
		self.emit('change', self.join(path), data);

	});

};

Model.prototype.defineSplice = function (path, data, argument) {
	var self = this;

	Array.prototype.slice.call(argument, 2).forEach(function (value) {

		if (self.isCollection(value)) value = self.observeCollection(path, value);
		Array.prototype.splice.call(data.meta, argument[0], argument[1], value);
		self.observeProperty(path, data, data.meta.length-1);
		self.emit('change', self.join(path), data);

	});

};

Model.prototype.arrayPushUnshift = function (path, data, method, argument) {
	var self = this;

	Array.prototype.forEach.call(argument, function (value) {

		if (self.isCollection(value)) value = self.observeCollection(path, value);
		Array.prototype[method].call(data.meta, value);
		self.observeProperty(path, data, data.meta.length-1);
		self.emit('change', self.join(path), data);

	});

};

Model.prototype.arrayPopShift = function (path, data, method) {
	var self = this;

	Array.prototype[method].call(data.meta);
	Array.prototype['pop'].call(data);
	self.emit('change', self.join(path), data);

};

Model.prototype.defineArray = function (path, data) {
	var self = this;

	return Object.defineProperties(data, {
		splice: {
			value: function () {
				return self.defineSplice(path, this, arguments);
			}
		},
		push: {
			value: function () {
				return self.arrayPushUnshift(path, this, 'push', arguments);
			}
		},
		unshift: {
			value: function () {
				return self.arrayPushUnshift(path, this, 'unshift', arguments);
			}
		},
		pop: {
			value: function () {
				return self.arrayPopShift(path, this, 'pop');
			}
		},
		shift: {
			value: function () {
				return self.arrayPopShift(path, this, 'shift');
			}
		}
	});

};

Model.prototype.defineObject = function (path, data) {
	var self = this;

	return Object.defineProperties(data, {
		set: {
			value: function (key, value) {

				if (this.isCollection(value)) {
					this.meta[key] = self.observeCollection(self.join(path, key), value);
				} else {
					this.meta[key] = value;
				}

				self.observeProperty(path, this, key);
				self.emit('change', self.join(path, key), this[key]);

			}
		},
		remove: {
			value: function (key) {

				delete this[key];
				delete this.meta[key];
				self.emit('change', self.join(path, key), undefined);

			}
		}
	});

};

Model.prototype.observeProperty = function (path, data, key) {
	var self = this;

	return Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.meta[key];
		},
		set: function (value) {

			if (value === undefined) {

				delete this[key];
				delete this.meta[key];
				self.emit('change', self.join(path, key), undefined);

			} else {

				if (self.isCollection(value)) {
					this.meta[key] = self.observeCollection(self.join(path, key), value);
				} else {
					this.meta[key] = value;
				}

				self.emit('change', self.join(path, key), this[key]);

			}

		}
	});

};

Model.prototype.observeCollection = function (path, source, target) {
	var self = this;

	var type = source ? source.constructor.name : '';
	if (type !== 'Object' && type !== 'Array' ) return source;
	if (target === undefined) target = source.constructor();

	if (type === 'Object') {
		self.defineObject(path, target);
	} else if (type === 'Array') {
		self.defineArray(path, target);
	}

	Object.defineProperty(target, 'meta', {
		value: source,
		writable: true,
		configurable: true
	});

	Object.keys(source).forEach(function (key) {

		if (source[key] !== undefined) {

			if (self.isCollection(source[key])) {
				target[key] = self.observeCollection(self.join(path, key), source[key]);
				target.meta[key] = target[key];
			}

			self.observeProperty(path, target, key);

		}

	});

	return target;
};

Model.prototype.set = function (path, value) {
	return Utility.setByPath(this.data, path, value);
};

Model.prototype.get = function (path) {
	return Utility.getByPath(this.data, path);
};

Model.prototype.setup = function (data) {
	this.data = this.observeCollection('', data);
	return this;
};

Model.prototype.create = function () {
	this.events = {};
	return this;
};

module.exports = function (data) {
	return new Model().create(data);
};
