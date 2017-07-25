
export default function Model () {}

Model.prototype.join = function () {
	return Array.prototype.join
	.call(arguments, '.')
	.replace(/\.{2,}/g, '.')
	.replace(/^\.|\.$/g, '');
};

Model.prototype.isCollection = function (data) {
	return data && (data.constructor.name === 'Object' || data.constructor.name === 'Array');
};

Model.prototype.defineSplice = function (path, meta, target, argument) {
	var self = this;

	if (argument[2]) {

		Array.prototype.splice.call(meta, argument[0], argument[1]);
		self.emit(self.join(path), target);

	} else {

		Array.prototype.slice.call(argument, 2).forEach(function (value) {

			value = self.defineCollection(path, value);
			Array.prototype.splice.call(meta, argument[0], argument[1], value);
			target = self.defineProperty(path, meta, target, meta.length-1);
			self.emit(self.join(path), target);

		});

	}

};

Model.prototype.arrayPushUnshift = function (path, meta, target, method, argument) {
	var self = this;

	Array.prototype.forEach.call(argument, function (value) {

		value = self.defineCollection(path, value);
		Array.prototype[method].call(meta, value);
		target = self.defineProperty(path, meta, target, meta.length-1);
		self.emit(self.join(path), target);

	});

};

Model.prototype.arrayPopShift = function (path, meta, target, method) {
	var self = this;

	Array.prototype[method].call(meta);
	Array.prototype.pop.call(target);
	self.emit(self.join(path), target);

};

Model.prototype.defineArray = function (path, meta, target) {
	var self = this;

	return Object.defineProperties(target, {
		splice: {
			value: function () {
				return self.defineSplice(path, meta, target, arguments);
			}
		},
		push: {
			value: function () {
				return self.arrayPushUnshift(path, meta, target, 'push', arguments);
			}
		},
		unshift: {
			value: function () {
				return self.arrayPushUnshift(path, meta, target, 'unshift', arguments);
			}
		},
		pop: {
			value: function () {
				return self.arrayPopShift(path, meta, target, 'pop');
			}
		},
		shift: {
			value: function () {
				return self.arrayPopShift(path, meta, target, 'shift');
			}
		}
	});

};

Model.prototype.defineObject = function (path, meta, target) {
	var self = this;

	return Object.defineProperties(target, {
		set: {
			value: function (key, value) {

				if (self.isCollection(value)) {
					value = self.defineCollection(self.join(path, key), value);
				}

				meta[key] = value;
				target = self.defineProperty(path, meta, target, key);
				self.emit(self.join(path, key), target[key]);

			}
		},
		remove: {
			value: function (key) {

				delete target[key];
				delete meta[key];
				self.emit(self.join(path, key), undefined);

			}
		}
	});

};

Model.prototype.defineProperty = function (path, meta, target, key) {
	var self = this;

	return Object.defineProperty(target, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return meta[key];
		},
		set: function (value) {

			if (meta[key] !== value) {

				if (value === undefined) {

					delete meta[key];
					delete target[key];
					self.emit(self.join(path, key), undefined);

				} else {

					meta[key] = self.defineCollection(self.join(path, key), value);
					self.emit(self.join(path, key), target[key]);

				}

			}

		}
	});

};

Model.prototype.defineCollection = function (path, source) {
	var self = this;

	if (!self.isCollection(source)) return source;

	var type = source ? source.constructor.name : '';
	var target = source.constructor();
	var meta = source.constructor();

	if (type === 'Object') {
		target = self.defineObject(path, meta, target);
	} else if (type === 'Array') {
		target = self.defineArray(path, meta, target);
	}

	Object.keys(source).forEach(function (key) {

		if (source[key] !== undefined) {

			meta[key] = self.defineCollection(self.join(path, key), source[key]);
			target = self.defineProperty(path, meta, target, key);

		}

	});

	return target;
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

Model.prototype.listener = function (listener) {
	this.emit = listener;
};

Model.prototype.run = function (data) {
	this.data = this.defineCollection('', data);
};
