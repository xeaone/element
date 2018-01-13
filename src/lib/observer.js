
var Observer = {};

// TODO sort reverse

Observer.arrayProperties = function (callback, path) {
	var self = this;

	return {
		push: {
			value: function () {

				if (!arguments.length) {
					return this.length;
				}


				for (var i = 0, l = arguments.length; i < l; i++) {
					this.$set(this.length, arguments[i], function () {
						callback(this.length + arguments.length, path.slice(0, -1), 'length');
					});
				}

				return this.length;
			}
		},
		unshift: {
			value: function () {

				if (!arguments.length) {
					return this.length;
				}

				callback(this.length + arguments.length, path.slice(0, -1), 'length');
				Array.prototype.unshift.apply(this, arguments);

				throw new Error('this needs to be looked at');

				for (var i = 0, l = this.length; i < l; i++) {
					this.$set(i, this[i]);
				}

				return this.length;
			}
		},
		pop: {
			value: function () {

				if (!this.length) {
					return;
				}

				var value = this[this.length-1];

				// this.length--;
				// this.$meta.length--;
				callback(this.length-1, path.slice(0, -1), 'length');
				this.$remove(this.length);
				// callback(undefined, path + this.length, this.length);

				return value;
			}
		},
		shift: {
			value: function () {

				if (!this.length) {
					return;
				}

				var value = this[0];

				for (var i = 0, l = this.length-1; i < l; i++) {
					this[i] = this[i+1];
				}

				// this.length--;
				// this.$meta.length--;
				callback(this.length-1, path.slice(0, -1), 'length');
				this.$remove(this.length);
				// callback(undefined, path + this.length, this.length);

				return value;
			}
		},
		splice: {
			value: function () {

				var startIndex = arguments[0];
				var deleteCount = arguments[1];
				var addCount = arguments.length > 2 ? arguments.length - 2 : 0;

				if (
					!this.length
					|| typeof startIndex !== 'number' || typeof deleteCount !== 'number'
				) {
					return [];
				}

				// handle negative startIndex
				if (startIndex < 0) {
					startIndex = this.length + startIndex;
					startIndex = startIndex > 0 ? startIndex : 0;
				} else {
					startIndex = startIndex < this.length ? startIndex : this.length;
				}

				// handle negative deleteCount
				if (deleteCount < 0) {
					deleteCount = 0;
				} else if (deleteCount > (this.length - startIndex)) {
					deleteCount = this.length - startIndex;
				}

				var index = 2;
				var result = this.slice(startIndex, deleteCount);
				var updateCount = deleteCount < addCount ? addCount-deleteCount : deleteCount-addCount;

				deleteCount = deleteCount-updateCount;
				addCount = addCount-updateCount;

				if (updateCount > 0) {
					while (updateCount--) {
						this.$set(startIndex++, arguments[index++]);
					}
				}

				if (addCount > 0) {
					callback(this.length + addCount, path, 'length');
					while (addCount--) {
						this.$set(this.length, arguments[index++]);
					}
				}

				if (deleteCount > 0) {
					callback(this.length - deleteCount, path, 'length');
					while (deleteCount--) {
						this.$remove(this.length-1);
					}
				}

				return result;
			}
		}
	};
};

Observer.objectProperties = function (listener, path) {
	var self = this;

	return {
		$get: {
			value: function (key) {
				return this[key];
			}
		},
		$set: {
			value: function (key, value, callback) {
				if (value !== this[key]) {
					var result = self.create(value, listener, path + key);

					this.$meta[key] = result;
					Object.defineProperty(this, key, self.property(listener, path, key));

					if (callback) {
						callback();
					}

					listener(result, path + key, key);
					return result;
				}
			}
		},
		$remove: {
			value: function (key) {
				if (key in this) {
					var result = this[key];

					if (this.constructor === Array) {
						Array.prototype.splice.call(this.$meta, key, 1);
						Array.prototype.splice.call(this, key, 1);
					} else {
						delete this.$meta[key];
						delete this[key];
					}

					listener(undefined, path + key, key);
					return result;
				}
			}
		}
	};
};

Observer.property = function (callback, path, key) {
	var self = this;

	return {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.$meta[key];
		},
		set: function (value) {
			if (value !== this.$meta[key]) {

				this.$meta[key] = self.create(value, callback, path + key);

				callback(this[key], path + key, key, this);
			}
		}
	};
};

Observer.create = function (source, callback, path) {
	var self = this;

	if (!source || typeof source !== 'object') {
		return source;
	}

	path = path ? path + '.' : '';

	var key;
	var type = source.constructor;
	var target = source.constructor();
	var properties = source.constructor();

	properties.$meta = {
		value: source.constructor()
	};

	if (type === Array) {

		for (key = 0, length = source.length; key < length; key++) {
			properties.$meta.value[key] = self.create(source[key], callback, path + key);
			properties[key] = self.property(callback, path, key);
		}

		var arrayProperties = self.arrayProperties(callback, path);
		for (key in arrayProperties) {
			properties[key] = arrayProperties[key];
		}

	} else {

		for (key in source) {
			properties.$meta.value[key] = self.create(source[key], callback, path + key);
			properties[key] = self.property(callback, path, key);
		}

	}

	var objectProperties = self.objectProperties(callback, path);
	for (key in objectProperties) {
		properties[key] = objectProperties[key];
	}

	return Object.defineProperties(target, properties);
};


// var d = { a: ['one'] };
// // var d = { a: 'foo', b: { c: 'la' } };
//
// var o = Observer.create(d, function () {
// 	console.log(arguments);
// });
//
// // o.a = 'bar';
// // console.log(d);
// // o.b.$set('d', { e: 'f' });
// // o.b.d.e = 'ff';
// // o.$set('g', [1])
// // o.g.push(2)
// // o.$remove('$meta')
//
// // o.a.push('two');
// o.a.splice(0, 1, 'two');
// console.log(JSON.stringify(o.a));

export default Observer;
