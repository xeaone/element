
var Observer = {};

Observer.create = function (data, callback, path) {
	Observer.defineProperties(data, callback, path, true);
	return data;
};

Observer.defineProperties = function (data, callback, path, redefine) {
	path = path ? path + '.' : '';

	var propertyDescriptors = {};

	for (var key in data) {
		var propertyDescriptor = Observer.createPropertyDescriptor(data, key, data[key], callback, path, redefine);

		if (propertyDescriptor) {
			propertyDescriptors[key] = propertyDescriptor;
		}

	}

	if (data.constructor === Object) {
		Object.defineProperties(data, propertyDescriptors);
		Observer.overrideObjectMethods(data, callback, path);
	}

	if (data.constructor === Array) {
		Observer.overrideArrayMethods(data, callback, path);
	}

};

Observer.defineProperty = function (data, key, value, callback, path, redefine) {
	var propertyDescriptor = Observer.createPropertyDescriptor(data, key, value, callback, path, redefine);

	if (propertyDescriptor) {
		Object.defineProperty(data, key, propertyDescriptor);
	}

};

Observer.createPropertyDescriptor = function (data, key, value, callback, path, redefine) {
	path = path || '';

	var property = Object.getOwnPropertyDescriptor(data, key);

	if (property && property.configurable === false) {
		return;
	}

	var getter = property && property.get;
	var setter = property && property.set;

	// recursive observe child properties
	if (value && typeof value === 'object') {
		Observer.defineProperties(value, callback, path + key, redefine);
	}

	// set the property value if getter setter previously defined and redefine is false
	if (getter && setter && !redefine) {
		setter.call(data, value);
		return;
	}

	return {
		enumerable: true,
		configurable: true,
		get: function () {
			return getter ? getter.call(data) : value;
		},
		set: function (newValue) {

			var oldValue = getter ? getter.call(data) : value;

			// set the value with the same value not updated
			if (newValue === oldValue) {
				return;
			}

			if (setter) {
				setter.call(data, newValue);
			} else {
				value = newValue;
			}

			//	adds attributes to new valued property getter setter
			if (newValue && typeof newValue === 'object') {
				Observer.defineProperties(newValue, callback, path + key, redefine);
			}

			if (callback) {
				callback(newValue, path + key, key, data);
			}

		}
	};
};

Observer.overrideObjectMethods = function (data, callback, path) {
	Object.defineProperties(data, {
		$set: {
			configurable: true,
			value: function (key, value) {

				if (typeof key !== 'string' || value === undefined) {
					return;
				}

				Observer.defineProperty(data, key, value, callback, path);

				if (!(key in data) && callback) {
					callback(data[key], path + key, key, data);
				}

				return data;
			}
		},
		$remove: {
			configurable: true,
			value: function (key) {

				if (typeof key !== 'string') {
					return;
				}

				delete data[key];

				if (callback) {
					callback(undefined, path + key, key, data);
				}

			}
		}
	});
};

Observer.overrideArrayMethods = function (data, callback, path) {
	Object.defineProperties(data, {
		push: {
			configurable: true,
			value: function () {

				if (!arguments.length) {
					return data.length;
				}

				for (var i = 0, l = arguments.length; i < l; i++) {
					Observer.defineProperty(data, data.length, arguments[i], callback, path);

					if (callback) {
						callback(data.length, path.slice(0, -1), 'length', data);
						callback(data[data.length-1], path + (data.length-1), data.length-1, data);
					}

				}

				return data.length;
			}
		},
		unshift: {
			configurable: true,
			value: function () {

				if (!arguments.length) {
					return data.length;
				}

				var i, l, result = [];

				for (i = 0, l = arguments.length; i < l; i++) {
					result.push(arguments[i]);
				}

				for (i = 0, l = data.length; i < l; i++) {
					result.push(data[i]);
				}

				for (i = 0, l = data.length; i < l; i++) {
					data[i] = result[i];
				}

				for (i = 0, l = result.length; i < l; i++) {
					Observer.defineProperty(data, data.length, result[i], callback, path);

					if (callback) {
						callback(data.length, path.slice(0, -1), 'length', data);
						callback(data[data.length-1], path + (data.length-1), data.length-1, data);
					}

				}

				return data.length;
			}
		},
		pop: {
			configurable: true,
			value: function () {

				if (!data.length) {
					return;
				}

				var value = data[data.length-1];

				data.length--;

				if (callback) {
					callback(data.length, path.slice(0, -1), 'length', data);
					callback(undefined, path + data.length, data.length, data);
				}

				return value;
			}
		},
		shift: {
			configurable: true,
			value: function () {

				if (!data.length) {
					return;
				}

				var value = data[0];

				for (var i = 0, l = data.length-1; i < l; i++) {
					data[i] = data[i+1];
				}

				data.length--;

				if (callback) {
					callback(data.length, path.slice(0, -1), 'length', data);
					callback(undefined, path + data.length, data.length, data);
				}

				return value;
			}
		},
		splice: {
			configurable: true,
			value: function (startIndex, deleteCount) {

				if (!data.length || (typeof startIndex !== 'number' && typeof deleteCount !== 'number')) {
					return [];
				}

				if (typeof startIndex !== 'number') {
					startIndex = 0;
				}

				if (typeof deleteCount !== 'number') {
					deleteCount = data.length;
				}

				var removed = [];
				var result = [];
				var index, i, l;

				// this would follow spec more or less
				// startIndex = parseInt(startIndex, 10);
				// deleteCount = parseInt(deleteCount, 10);

				// handle negative startIndex
				if (startIndex < 0) {
					startIndex = data.length + startIndex;
					startIndex = startIndex > 0 ? startIndex : 0;
				} else {
					startIndex = startIndex < data.length ? startIndex : data.length;
				}

				// handle negative deleteCount
				if (deleteCount < 0) {
					deleteCount = 0;
				} else if (deleteCount > (data.length - startIndex)) {
					deleteCount = data.length - startIndex;
				}

				// copy items up to startIndex
				for (i = 0; i < startIndex; i++) {
					result[i] = data[i];
				}

				// add new items from arguments
				for (i = 2, l = arguments.length; i < l; i++) {
					result.push(arguments[i]);
				}

				// copy removed items
				for (i = startIndex, l = startIndex + deleteCount; i < l; i++) {
					removed.push(data[i]);
				}

				// add the items after startIndex + deleteCount
				for (i = startIndex + deleteCount, l = data.length; i < l; i++) {
					result.push(data[i]);
				}

				index = 0;
				i = result.length - data.length;
				i = result.length - (i < 0 ? 0 : i);

				// update all observed items
				while (i--) {
					data[index] = result[index];
					index++;
				}

				i = result.length - data.length;

				// add and observe or remove items
				if (i > 0) {

					while (i--) {
						Observer.defineProperty(data, data.length, result[index++], callback, path);

						if (callback) {
							callback(data.length, path.slice(0, -1), 'length', data);
							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
						}

					}

				} else if (i < 0) {

					while (i++) {
						data.length--;

						if (callback) {
							callback(data.length, path.slice(0, -1), 'length', data);
							callback(undefined, path + data.length, data.length, data);
						}

					}

				}

				return removed;
			}
		}
	});
};

export default Observer;
