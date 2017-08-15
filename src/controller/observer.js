
function overrideArrayMethods (array, callback, path) {
	return Object.defineProperties(array, {
		splice: {
			value: function () {
				Array.prototype.splice.apply(this, arguments);
				callback(arguments[0], path, null, this);
			}
		},
		push: {
			value: function () {
				if (arguments.length) {
					Array.prototype.forEach.call(arguments, function (argument) {
						defineProperty(this, this.length, argument, callback, path);
						callback(this[this.length-1], path, null, this);
					}, this);
				}
			}
		},
		unshift: {
			value: function () {
				if (arguments.length) {

					var nIndex, oIndex;
					var oLength = this.length;
					var nLength = oLength + arguments.length;

					while (oLength) {
						nIndex = nLength-1;
						oIndex = oLength-1;
						Object.defineProperty(this, nIndex, Object.getOwnPropertyDescriptor(this, oIndex));
						callback(this[nIndex], path + nIndex, nIndex, this);
						nLength--;
						oLength--;
					}

					Array.prototype.forEach.call(arguments, function (argument, index) {
						this[index] = argument;
					}, this);

				}
			}
		},
		pop: {
			value: function () {
				Array.prototype.pop.apply(this, arguments);
				callback(arguments[0], path, null, this);
			}
		},
		shift: {
			value: function () {
				Array.prototype.shift.apply(this, arguments);
				callback(arguments[0], path, null, this);
			}
		}
	});
}

function defineProperty (collection, key, value, callback, path) {
	var property = Object.getOwnPropertyDescriptor(collection, key);

	if (property && property.configurable === false) {
		return;
	}

	var getter = property && property.get;
	var setter = property && property.set;

	//  recursive way to add attributes to the property getter setter
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

			//  adds attributes to new valued property getter setter
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

// m1.obj0.obj1.foo2 = 'new foo';

// Array Push
// m1.arr.push('three');
// console.log(m1.arr[m1.arr.length-1]);
// console.log('');

// Array Unshift
m1.arr.unshift('zero', 'one', 'two');
// console.log(m1.arr[0]);
// console.log(m1.arr[1]);
// console.log('');


// var m2 = Observer(model, function () {
	// console.log('cb2');
	// console.log(arguments);
// });

// m2.num = 2;
// console.log(m2 === m1);

/*

	if type is array && insert
		add element at index
		get all greater than index and
		update values


*/
