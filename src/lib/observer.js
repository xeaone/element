
var Observer = {};

/*
	TODO:
		sort reverse
		test array methods
		figure out a way to not update removed items
*/

Observer.splice = function () {
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

	var totalCount = this.$meta.length;
	var key, index, value, updateCount;
	var argumentIndex = 2;
	var argumentsCount = arguments.length - argumentIndex;
	var result = this.slice(startIndex, deleteCount);

	// if (addCount === deleteCount) {
	// 	updateCount = addCount;
	// } else if (addCount > deleteCount) {
	// 	updateCount = deleteCount % addCount;
	// } else if (deleteCount > addCount) {
	// 	updateCount = addCount % deleteCount;
	// }

	updateCount = (totalCount - 1) - startIndex;

	// console.log(`startIndex: ${startIndex}`);
	// console.log(`updateCount: ${updateCount}`);
	// console.log(`addCount: ${addCount}`);
	// console.log(`deleteCount: ${deleteCount}`);

	if (updateCount > 0) {
		index = startIndex;
		while (updateCount--) {
			key = index++;

			if (argumentsCount && argumentIndex < argumentsCount) {
				value = arguments[argumentIndex++];
			} else {
				value = this.$meta[index];
			}

			this.$meta[key] = Observer.create(value, this.$meta.listener, this.$meta.path + key);
			this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
		}
	}

	if (addCount > 0) {
		while (addCount--) {
			key = this.length;
			this.$meta[key] = Observer.create(arguments[argumentIndex++], this.$meta.listener, this.$meta.path + key);
			Observer.defineProperty(this, key);
			this.$meta.listener(this.length, this.$meta.path.slice(0, -1), 'length');
			this.$meta.listener(this.$meta[key], this.$meta.path + key, key);
		}
	}

	if (deleteCount > 0) {
		while (deleteCount--) {
			this.$meta.length--;
			this.length--;
			key = this.length;
			this.$meta.listener(key, this.$meta.path.slice(0, -1), 'length');
			this.$meta.listener(undefined, this.$meta.path + key, key);
		}
	}

	return result;
};

Observer.arrayProperties = function () {
	var self = this;

	return {
		push: {
			value: function () {
				if (!arguments.length) return this.length;

				for (var i = 0, l = arguments.length; i < l; i++) {
					self.splice.call(this, this.length, 0, arguments[i]);
				}

				return this.length;
			}
		},
		unshift: {
			value: function () {
				if (!arguments.length) return this.length;

				for (var i = 0, l = arguments.length; i < l; i++) {
					self.splice.call(this, 0, 0, arguments[i]);
				}

				return this.length;
			}
		},
		pop: {
			value: function () {
				if (!this.length) return;
				return self.splice.call(this, this.length-1, 1);
			}
		},
		shift: {
			value: function () {
				if (!this.length) return;
				return self.splice.call(this, 0, 1);
			}
		},
		splice: {
			value: self.splice
		}
	};
};

Observer.objectProperties = function () {
	var self = this;

	return {
		$get: {
			value: function (key) {
				return this[key];
			}
		},
		$set: {
			value: function (key, value) {
				if (value !== this[key]) {
					var result = self.create(value, this.$meta.listener, this.$meta.path + key);

					this.$meta[key] = result;
					self.defineProperty(this, key);

					this.$meta.listener(result, this.$meta.path + key, key);

					return result;
				}
			}
		},
		$remove: {
			value: function (key) {
				if (key in this) {
					if (this.constructor === Array) {
						return self.splice.call(this, key, 1);
					} else {
						var result = this[key];
						delete this.$meta[key];
						delete this[key];
						this.$meta.listener(undefined, this.$meta.path + key, key);
						return result;
					}
				}
			}
		}
	};
};

Observer.property = function (key) {
	var self = this;

	return {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.$meta[key];
		},
		set: function (value) {
			if (value !== this.$meta[key]) {

				this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);

				this.$meta.listener(this[key], this.$meta.path + key, key, this);
			}
		}
	};
};

Observer.defineProperty = function (data, key) {
	return Object.defineProperty(data, key, this.property(key));
};

Observer.create = function (source, listener, path) {
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

	properties.$meta.value.path = path;
	properties.$meta.value.listener = listener;

	if (type === Array) {

		for (key = 0, length = source.length; key < length; key++) {
			properties.$meta.value[key] = self.create(source[key], listener, path + key);
			properties[key] = self.property(key);
		}

		var arrayProperties = self.arrayProperties();

		for (key in arrayProperties) {
			properties[key] = arrayProperties[key];
		}

	} else {

		for (key in source) {
			properties.$meta.value[key] = self.create(source[key], listener, path + key);
			properties[key] = self.property(key);
		}

	}

	var objectProperties = self.objectProperties();

	for (key in objectProperties) {
		properties[key] = objectProperties[key];
	}

	return Object.defineProperties(target, properties);
};

export default Observer;
