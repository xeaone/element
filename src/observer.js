
/*
	TODO:
		sort reverse
		test array methods
		figure out a way to not update removed items
*/

const Observer = {

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
		let argumentIndex = 2;
		let argumentsCount = arguments.length - argumentIndex;
		const result = self.slice(startIndex, deleteCount);

		let updateCount = (totalCount - 1) - startIndex;

		const promises = [];

		const length = self.length + addCount - deleteCount;

		if (self.length !== length) {
			promises.push(self.$meta.listener.bind(null, self, self.$meta.path.slice(0, -1), 'length'));
		}

		if (updateCount > 0) {
			let value;
			let index = startIndex;

			while (updateCount--) {
				const key = index++;

				if (argumentsCount && argumentIndex < argumentsCount) {
					value = arguments[argumentIndex++];
				} else {
					value = self.$meta[index];
				}

				self.$meta[key] = Observer.create(value, self.$meta.listener, self.$meta.path + key);
				promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));
			}

		}

		// let oldLength = self.length;

		if (addCount > 0) {
			// promises.push(self.$meta.listener.bind(null, self.length + addCount, self.$meta.path.slice(0, -1), 'length'));
			// const position = promises.length;
			while (addCount--) {
				const key = self.length;

				if (key in this === false) {
					Object.defineProperty(this, key, Observer.descriptor(key));
				}

				self.$meta[key] = Observer.create(arguments[argumentIndex++], self.$meta.listener, self.$meta.path + key);
				// promises.push(self.$meta.listener.bind(null, self.$meta[key], self.$meta.path + key, key));

			}
			// promises.splice(position, 0, self.$meta.listener.bind(null, self, self.$meta.path.slice(0, -1), 'length'));
		}

		if (deleteCount > 0) {
			// promises.push(self.$meta.listener.bind(null, self.length - deleteCount, self.$meta.path.slice(0, -1), 'length'));
			while (deleteCount--) {
				self.$meta.length--;
				self.length--;
				const key = self.length;
				// promises.push(self.$meta.listener.bind(null, undefined, self.$meta.path + key, key));
			}
		}

		// if (self.length !== oldLength) {
		// 	promises.push(self.$meta.listener.bind(null, self, self.$meta.path.slice(0, -1), 'length'));
		// 	// promises.push(self.$meta.listener.bind(null, self.length, self.$meta.path.slice(0, -1), 'length'));
		// }

		Promise.resolve().then(function () {
			promises.reduce(function (promise, item) {
				return promise.then(item);
			}, Promise.resolve());
		}).catch(console.error);

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
					const result = self.splice.call(this, this.length-1, 1);
					return result[0];
				}
			},
			shift: {
				value: function () {
					if (!this.length) return;
					const result = self.splice.call(this, 0, 1);
					return result[0];
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

						if (key in this === false) {
							Object.defineProperty(this, key, self.descriptor(key));
						}

						this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
						this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
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

	descriptor (key) {
		const self = this;

		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return this.$meta[key];
			},
			set: function (value) {
				if (value !== this.$meta[key]) {
					this.$meta[key] = self.create(value, this.$meta.listener, this.$meta.path + key);
					this.$meta.listener(this.$meta[key], this.$meta.path + key, key, this);
				}
			}
		};
	},

	create (source, listener, path) {
		const self = this;

		if (!source || source.constructor !== Object && source.constructor !== Array) {
			return source;
		}

		path = path ? path + '.' : '';

		const type = source.constructor;
		const target = source.constructor();
		const descriptors = {};

		descriptors.$meta = {
			value: source.constructor()
		};

		descriptors.$meta.value.path = path;
		descriptors.$meta.value.listener = listener;

		if (type === Array) {
			for (let key = 0, length = source.length; key < length; key++) {
				descriptors.$meta.value[key] = this.create(source[key], listener, path + key);
				descriptors[key] = this.descriptor(key);
			}
		}

		if (type === Object) {
			for (let key in source) {
				descriptors.$meta.value[key] = this.create(source[key], listener, path + key);
				descriptors[key] = this.descriptor(key);
			}
		}

		Object.defineProperties(target, descriptors);
		Object.defineProperties(target, this.objectProperties(source, listener, path));

		if (type === Array) {
			Object.defineProperties(target, this.arrayProperties(source, listener, path));
		}

		return target;
	}

};

export default Observer;
