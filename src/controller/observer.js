
function overrideArrayMethods (array, callback, path) {
	return Object.defineProperties(array, {
		push: {
			value: function () {
				if (arguments.length) {
					var i = 0;
					var l = arguments.length;
					while (l--) {
						defineProperty(this, this.length, arguments[i++], callback, path);
						callback(this.length, path + 'length', 'length', this);
						callback(this[this.length-1], path + (this.length-1), this.length-1, this);
					}
				}

				return this.length;
			}
		},
		unshift: {
			value: function () {
				if (arguments.length) {
					var index = 0;
					var count = 0;
					var backup = [];
					var thisLength = this.length;
					var argumentsLength = arguments.length;
					var length = argumentsLength + thisLength;

					while (length--) {
						backup[index] = this[index];

						if (index < argumentsLength) {
							if (index < thisLength) {
								this[index] = arguments[index];
							} else {
								defineProperty(this, index, arguments[index], path);
								callback(this.length, path + 'length', 'length', this);
								callback(this[index], path + index, index, this);
							}
						} else {
							if (index < thisLength) {
								this[index] = backup[count];
							} else {
								defineProperty(this, index, backup[count], path);
								callback(this.length, path + 'length', 'length', this);
								callback(this[index], path + index, index, this);
							}

							count++;
						}

						index++;
					}
				}

				return this.length;
			}
		},
		pop: {
			value: function () {
				if (this.length) {
					var index = this.length-1;
					var value = this[index];
					this.length--;
					callback(index, path + 'length', 'length', this);
					callback(value, path + index, index, this);
					return value;
				}
			}
		},
		shift: {
			value: function () {
				if (this.length) {
					var index = this.length-1;
					var item = this[index];
					var value = this[0];

					this.length--;
					callback(index, path + 'length', 'length', this);

					for (var i = 0, l = this.length-1; i < l; i++) {
						this[i] = this[i+1];
					}

					this[l] = item;

					return value;
				}
			}
		},
		splice: {
			value: function (array, start, deleteCount) {
				var argLen = arguments.length;
				var arrLen = array.length;
				var removed = [];
				var result = [];
				var i;

				// Follow spec more or less
				start = parseInt(start, 10);
				deleteCount = parseInt(deleteCount, 10);

				// Deal with negative start per spec
				// Don't assume support for Math.min/max
				if (start < 0) {
					start = arrLen + start;
					start = (start > 0)? start : 0;
				} else {
					start = (start < arrLen)? start : arrLen;
				}

				// Deal with deleteCount per spec
				if (deleteCount < 0) deleteCount = 0;

				if (deleteCount > (arrLen - start)) {
					deleteCount = arrLen - start;
				}

				// Copy members up to start
				for (i = 0; i < start; i++) {
					result[i] = array[i];
				}

				// Add new elements supplied as args
				for (i = 3; i < argLen; i++) {
					result.push(arguments[i]);
				}

				// Copy removed items to removed array
				for (i = start; i < start + deleteCount; i++) {
					removed.push(array[i]);
				}

				// Add those after start + deleteCount
				for (i = start + (deleteCount || 0); i < arrLen; i++) {
					result.push(array[i]);
				}

				// Update original array
				var lengthChange = result.length - array.length;

				i = result.length;
				array.length = i;

				if (lengthChange) {
					callback(i, path + 'length', 'length', this);
				}

				while (i--) {
					array[i] = result[i];
				}

				// Return array of removed elements
				return removed;
			}
		},
	});
}

function defineProperty (collection, key, value, callback, path) {
	var property = Object.getOwnPropertyDescriptor(collection, key);

	if (property && property.configurable === false) {
		return;
	}

	var getter = property && property.get;
	var setter = property && property.set;

	// recursive
	if (value && typeof value === 'object') {
		value = Observer(value, callback, path + key);
	}

	Object.defineProperty(collection, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return getter ? getter.call(collection) : value;
		},
		set: function (newValue) {
			var oldValue = getter ? getter.call(collection) : value;

			// set the value with the same value not updated
			if (newValue === oldValue) {
				return;
			}

			if (setter) {
				setter.call(collection, newValue);
			} else {
				value = newValue;
			}

			//	adds attributes to new valued property getter setter
			if (newValue && typeof newValue === 'object') {
				newValue = Observer(newValue, callback, path + key);
			}

			return callback(newValue, path + key, key, collection);
		}
	});
}

function Observer (collection, callback, path) {
	path = path ? path + '.' : '';

	Object.keys(collection).forEach(function (key) {
		defineProperty(collection, key, collection[key], callback, path);
	});

	if (collection.constructor === Array) {
		collection = overrideArrayMethods(collection, callback, path);
	}

	return collection;
}

var model = {
	num: 1,
	foo0: 'bar0',
	obj0: {
		foo1: 'bar1',
		obj1: {
			foo2: 'bar2',
		}
	},
	arr: ['three', 'four']
};

var m1 = Observer(model, function (value, path, key, collection) {
	console.log('value: ' + value);
	console.log('path: ' + path);
	console.log('key: ' + key);
	console.log(collection);
});

// Array Push
// m1.arr.push('five', 'six');


// Array Unshift
// m1.arr.unshift('zero', 'one', 'two');
// console.log(m1.arr);


// Array Pop
// console.log(m1.arr.pop());


// Array Shift
// console.log(m1.arr.shift());



// var m2 = Observer(model, function () {
	// console.log('cb2');
	// console.log(arguments);
// });

// m2.num = 2;
// console.log(m2 === m1);
