
/*
	TODO:
		sort reverse
		test array methods
		figure out a way to not update removed items
*/

let Observer = {

	splice () {
		const self = this;

		let startIndex = arguments[0];
		let deleteCount = arguments[1];
		let addCount = arguments.length > 2 ? arguments.length - 2 : 0;

		if (typeof startIndex !== 'number' || typeof deleteCount !== 'number') {
			return [];
		}

		// handle negative startIndex
		if (startIndex < 0) {
			startIndex = self.length + startIndex;
			startIndex = startIndex > 0 ? startIndex : 0;
		} else {
			startIndex = startIndex < self.length ? startIndex : self.length;
		}

		// handle negative deleteCount
		if (deleteCount < 0) {
			deleteCount = 0;
		} else if (deleteCount > (self.length - startIndex)) {
			deleteCount = self.length - startIndex;
		}

		let totalCount = self.$meta.length;
		let key, index, value, updateCount;
		let argumentIndex = 2;
		let argumentsCount = arguments.length - argumentIndex;
		let result = self.slice(startIndex, deleteCount);

		updateCount = (totalCount - 1) - startIndex;

		let promises = [];

		if (updateCount > 0) {
			index = startIndex;

			while (updateCount--) {
				key = index++;

				if (argumentsCount && argumentIndex < argumentsCount) {
					value = arguments[argumentIndex++];
				} else {
					value = self.$meta[index];
				}

				self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
				promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
			}

		}

		if (addCount > 0) {

			// promises.push(self.$meta.listener.bind(null, self.length + addCount, self.$meta.path.slice(0, -1), 'length'));

			while (addCount--) {
				key = self.length;
				Observer.defineProperty(self, key);
				self.$meta[key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + key);
				promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));

			}

			promises.push(self.$meta.listener.bind(null, self.length, self.$meta.path.slice(0, -1), 'length'));

		}

		if (deleteCount > 0) {

			// promises.push(self.$meta.listener.bind(null, self.length - deleteCount, self.$meta.path.slice(0, -1), 'length'));

			while (deleteCount--) {
				self.$meta.length--;
				self.length--;
				key = self.length;
				promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + key, key));
			}

			promises.push(self.$meta.listener.bind(null, self.length, self.$meta.path.slice(0, -1), 'length'));

		}

		promises.reduce(function (promise, item) {
			return promise.then(item);
		}, Promise.resolve()).catch(console.error);

		return result;
	},

	arrayProperties () {
		const self = this;

		return {
			push: {
				value: function () {
					if (!arguments.length) return this.length;

					for (let i = 0, l = arguments.length; i < l; i++) {
						self.splice.call(this, this.length, 0, arguments[i]);
					}

					return this.length;
				}
			},
			unshift: {
				value: function () {
					if (!arguments.length) return this.length;

					for (let i = 0, l = arguments.length; i < l; i++) {
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
	},

	objectProperties () {
		const self = this;

		return {
			$get: {
				value: function (key) {
					return this.$meta[key];
				}
			},
			$set: {
				value: function (key, value) {
					if (value !== this.$meta[key]) {
						if (key in this === false) self.defineProperty(this, key);
						this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
						this.$meta.listener(this[key], this.$meta.path + key, key, this);
					}
				}
			},
			$remove: {
				value: function (key) {
					if (key in this) {
						if (this.constructor === Array) {
							return self.splice.call(this, key, 1);
						} else {
							let result = this[key];
							delete this.$meta[key];
							delete this[key];
							this.$meta.listener(undefined, this.$meta.path + key, key);
							return result;
						}
					}
				}
			}
		};
	},

	property (key) {
		const self = this;

		return {
			enumerable: true,
			configurable: true,
			get: function () {
				// return this.$meta[key];
				return this.$meta[key];
			},
			set: function (value) {
				console.log(key);
				// if (value !== this.$meta[key]) {

					// if (value && value.constructor === Array && value.length < this[key].length) {
						// console.log(JSON.stringify(value));
						// console.log(JSON.stringify(this[key]));
						// console.log(JSON.stringify(this.$meta[key]));
						// delete this[key];
					// 	delete this.$meta[key];
					// }

					console.log(value);

					this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
					this.$meta.listener(this[key], this.$meta.path + key, key, this);

					// setTimeout(function () {
					// 	console.log(JSON.stringify(value));
					// 	console.log(JSON.stringify(this[key]));
					// 	console.log(JSON.stringify(this.$meta[key]));
					// }.bind(this), 1000);

				// }
			}
		};
	},

	defineProperty (data, key) {
		return Object.defineProperty(data, key, this.property(key));
	},

	create (source, listener, path) {
		const self = this;

		if (!source || source.constructor !== Object && source.constructor !== Array) {
			return source;
		}

		path = path ? path + '.' : '';

		let key, length;
		const type = source.constructor;
		const target = source.constructor();
		const properties = source.constructor();

		properties.$meta = {
			value: source.constructor()
		};

		properties.$meta.value.path = path;
		properties.$meta.value.listener = listener;

		if (type === Array) {
			console.log(source.length);

			for (key = 0, length = source.length; key < length; key++) {
				// properties.$meta.value[key] = self.create(source[key], listener, path + key);
				properties[key] = self.property(key, source[key], listener, path + key);
			}

			let arrayProperties = self.arrayProperties();

			for (key in arrayProperties) {
				properties[key] = arrayProperties[key];
			}

		}

		if (type === Object) {

			for (key in source) {
				// properties.$meta.value[key] = self.create(source[key], listener, path + key);
				// properties[key] = self.property(key);
				properties[key] = self.property(key, source[key], listener, path + key);
			}

		}

		let objectProperties = self.objectProperties();

		for (key in objectProperties) {
			properties[key] = objectProperties[key];
		}

		console.log(properties);

		return Object.defineProperties(target, properties);
	}

};

export default Observer;
