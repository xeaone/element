
function Observer () {}

Observer.prototype.ins = function (observed, callback, prefix, key, value) {

	if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
		value = this.create(value, callback, prefix + key, true);
	}

	if (observed.constructor.name === 'Array' && key == -1) {
		key = 0;
		observed.splice(key, 0, value);
		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		key = observed.length-1;
		value = observed[key];
	}

	observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
	if (callback) callback(prefix + key, value);
};

Observer.prototype.del = function (observed, callback, prefix, key) {
	if (observed.constructor.name === 'Object') {
		delete observed[key];
	} else if (observed.constructor.name === 'Array') {
		var l = observed.length - 1;
		observed.splice(key, 1);
		key = l;
	}

	if (callback) callback(prefix + key, undefined);
};

Observer.prototype.descriptor = function (k, v, c) {
	return {
		configurable: true,
		enumerable: true,
		get: function () {
			return v;
		},
		set: function (nv) {
			v = nv;
			c(k, v);
		}
	};
};

Observer.prototype.create = function (observable, callback, prefix, trigger) {
	var observed, key, value, type;

	if (!prefix) prefix = '';
	else prefix += '.';

	type = observable.constructor.name;
	observed = type === 'Object' ? {} : [];

	observed = Object.defineProperty(observed, 'ins', {
		value: this.ins.bind(this, observed, callback, prefix)
	});

	observed = Object.defineProperty(observed, 'del', {
		value: this.del.bind(this, observed, callback, prefix)
	});

	for (key in observable) {
		value = observable[key];
		type = value.constructor.name;

		if (type === 'Object' || type === 'Array') value = this.create(value, callback, prefix + key);
		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		if (trigger && callback) callback(prefix + key, value);
	}

	return observed;
};

module.exports = function (observable, callback) {
	return new Observer().create(observable, callback);
};
