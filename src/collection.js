
export default function Collection (data) {
	Object.defineProperty(this, 'data', {
		value: data || []
	});
}

Collection.prototype.find = function (method) {
	for (var i = 0; i < this.data.length; i++) {
		if (method(this.data[i][1], this.data[i][0], i) === true) {
			return this.data[i][1];
		}
	}
};

Collection.prototype.get = function (key) {
	for (var i = 0; i < this.data.length; i++) {
		if (key === this.data[i][0]) {
			return this.data[i][1];
		}
	}
};

Collection.prototype.remove = function (key) {
	for (var i = 0; i < this.data.length; i++) {
		if (key === this.data[i][0]) {
			return this.data.splice(i, 1)[0][1];
		}
	}
};

Collection.prototype.removeById = function (id) {
	return this.data.splice(id, 1);
};

Collection.prototype.has = function (key) {
	for (var i = 0; i < this.data.length; i++) {
		if (key === this.data[i][0]) {
			return true;
		}
	}

	return false;
};

Collection.prototype.set = function (key, value) {
	for (var i = 0; i < this.data.length; i++) {
		if (key === this.data[i][0]) {
			return this.data[i][1] = value;
		}
	}

	return this.data[this.data.length] = [key, value];
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

	for (var i = 0; i < this.data.length; i++) {
		callback.call(context, this.data[i][1], this.data[i][0], i, this.data);
	}
};
