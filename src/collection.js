
function Collection (data) {
	Object.defineProperty(this, 'data', {
		value: data || []
	});
}

Collection.prototype.get = function (key) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (key === this.data[i][0]) {
			return this.data[i][1];
		}
	}
};

Collection.prototype.remove = function (key) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (key === this.data[i][0]) {
			return this.data.splice(i, 1)[0][1];
		}
	}
};

Collection.prototype.has = function (key) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (key === this.data[i][0]) {
			return true;
		}
	}

	return false;
};

Collection.prototype.set = function (key, value) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (key === this.data[i][0]) {
			return this.data[i][1] = value;
		}
	}

	return this.data[l] = [key, value];
};

Collection.prototype.push = function (value) {
	this.data[this.data.length] = [this.data.length, value];
	return value;
};

Collection.prototype.size = function () {
	return this.data.length;
};

Collection.prototype.forEach = function (callback, context) {
	context = context || null;

	for (var i = 0, l = this.data.length; i < l; i++) {
		callback.call(context, this.data[i][1], this.data[i][0], this.data[i]);
	}
};

module.exports = Collection;
