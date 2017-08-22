
export default function Collection (data) {
	Object.defineProperty(this, 'data', {
		value: data || []
	});
}

Collection.prototype.find = function (method) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (method(this.data[i][1], this.data[i][0], i) === true) {
			return this.data[i][1];
		}
	}
};

Collection.prototype.get = function (key) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (key === this.data[i][0]) {
			return this.data[i][1];
		}
	}
};

// Collection.prototype.remove = function (key) {
// 	for (var i = 0, l = this.data.length; i < l; i++) {
// 		if (key === this.data[i][0]) {
// 			return this.data.splice(i, 1)[0][1];
// 		}
// 	}
// };

Collection.prototype.remove = function (id) {
	return this.data.splice(id, 1);
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

	return this.data[this.data.length] = [key, value];
};

Collection.prototype.push = function (value) {
	if (!arguments.length) return this.length;
	this.data[this.data.length] = [this.data.length, value];
	return this.data.length;
};

Collection.prototype.size = function () {
	return this.data.length;
};

Collection.prototype.forEach = function (callback) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		callback(this.data[i][1], this.data[i][0], i, this.data);
	}
};
