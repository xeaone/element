
export default function Observer (data, callback, path) {
	defineProperties(data, callback, path, true);
	return data;
}

function defineProperties (data, callback, path, redefine) {
	path = path ? path + '.' : '';
	for (var key in data) defineProperty(data, key, data[key], callback, path, redefine);
	if (data.constructor === Object) overrideObjectMethods(data, callback, path);
	else if (data.constructor === Array) overrideArrayMethods(data, callback, path);
}

function defineProperty (data, key, value, callback, path, redefine) {
	var property = Object.getOwnPropertyDescriptor(data, key);

	if (property && property.configurable === false) return;

	var getter = property && property.get;
	var setter = property && property.set;

	// recursive observe child properties
	if (value && typeof value === 'object') defineProperties(value, callback, path + key, redefine);

	// set the property value if getter setter previously defined and redefine is not true
	if (getter && setter && redefine === false) return setter.call(data, value);

	Object.defineProperty(data, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return getter ? getter.call(data) : value;
		},
		set: function (newValue) {
			var oldValue = getter ? getter.call(data) : value;

			// set the value with the same value not updated
			if (newValue === oldValue) return;

			if (setter) setter.call(data, newValue);
			else value = newValue;

			//	adds attributes to new valued property getter setter
			if (newValue && typeof newValue === 'object') defineProperties(newValue, callback, path + key, redefine);

			if (callback) callback(newValue, path + key, key, data);
		}
	});
}

function overrideObjectMethods (data, callback, path) {
	Object.defineProperties(data, {
		$set: {
			configurable: true,
			value: function (key, value) {
				if (typeof key !== 'string' || value === undefined) return;
				var isNew = !(key in data);
				defineProperty(data, key, value, callback, path);
				if (isNew && callback) callback(data[key], path + key, key, data);
				return data;
			}
		},
		$remove: {
			configurable: true,
			value: function (key) {
				if (typeof key !== 'string') return;
				delete data[key];
				if (callback) callback(undefined, path + key, key, data);
			}
		}
	});
}

function overrideArrayMethods (data, callback, path) {
	Object.defineProperties(data, {
		push: {
			configurable: true,
			value: function () {
				if (!arguments.length) return data.length;

				for (var i = 0, l = arguments.length; i < l; i++) {
					defineProperty(data, data.length, arguments[i], callback, path);

					if (callback) {
						callback(data.length, path + 'length', 'length', data);
						callback(data[data.length-1], path + (data.length-1), data.length-1, data);
					}

				}

				return data.length;
			}
		},
		unshift: {
			configurable: true,
			value: function () {
				if (!arguments.length) return data.length;

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
				// for (i, l = result.length; i < l; i++) {
					defineProperty(data, data.length, result[i], callback, path);
					if (callback) {
						callback(data.length, path + 'length', 'length', data);
						callback(data[data.length-1], path + (data.length-1), data.length-1, data);
					}
				}

				return data.length;
			}
		},
		pop: {
			configurable: true,
			value: function () {
				if (!data.length) return;

				var value = data[data.length-1];

				data.length--;

				if (callback) {
					callback(data.length, path + 'length', 'length', data);
					callback(undefined, path + data.length, data.length, data);
				}

				return value;
			}
		},
		shift: {
			configurable: true,
			value: function () {
				if (!data.length) return;

				var value = data[0];

				for (var i = 0, l = data.length-1; i < l; i++) {
					data[i] = data[i+1];
				}

				data.length--;

				if (callback) {
					callback(data.length, path + 'length', 'length', data);
					callback(undefined, path + data.length, data.length, data);
				}

				return value;
			}
		},
		splice: {
			configurable: true,
			value: function (startIndex, deleteCount) {
				if (!data.length || (typeof startIndex !== 'number' && typeof deleteCount !== 'number')) return [];
				if (typeof startIndex !== 'number') startIndex = 0;
				if (typeof deleteCount !== 'number') deleteCount = data.length;

				var removed = [];
				var result = [];
				var index, i, l;

				// follow spec more or less
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
						defineProperty(data, data.length, result[index++], callback, path);
						if (callback) {
							callback(data.length, path + 'length', 'length', data);
							callback(data[data.length-1], path + (data.length-1), data.length-1, data);
						}
					}
				} else if (i < 0) {
					while (i++) {
						data.length--;
						if (callback) {
							callback(data.length, path + 'length', 'length', data);
							callback(undefined, path + data.length, data.length, data);
						}
					}
				}

				return removed;
			}
		}
	});
}
