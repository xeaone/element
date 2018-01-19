import Observer from './lib/observer';
import Global from './global';

var Model = function (opt) {
	opt = opt || {};
	this.GET = 2;
	this.SET = 3;
	this.REMOVE = 4;
	this.data = opt.data || {};
};

Model.prototype.traverse = function (type, keys, value) {

	if (typeof keys === 'string') {
		keys = [keys];
	}

	var data = this.data;
	var v, p, path, result;
	var key = keys[keys.length-1];

	for (var i = 0, l = keys.length-1; i < l; i++) {

		if (!(keys[i] in data)) {

			if (type === this.GET || type === this.REMOVE) {
				return undefined;
			} else if (type === this.SET) {
				data.$set(keys[i], isNaN(keys[i+1]) ? {} : []);
			}

		}

		data = data[keys[i]];
	}

	if (type === this.SET) {
		result = data.$set(key, value);
	} else if (type === this.GET) {
		result = data[key];
	} else if (type === this.REMOVE) {
		result = data[key];
		data.$remove(key);
	}

	return result;
};

Model.prototype.get = function (keys) {
	return this.traverse(this.GET, keys);
};

Model.prototype.remove = function (keys) {
	return this.traverse(this.REMOVE, keys);
};

Model.prototype.set = function (keys, value) {
	return this.traverse(this.SET, keys, value);
};

Model.prototype.listener = function (data, path) {

	var paths = path.split('.');

	if (paths.length < 2) {
		return;
	}

	var scope = paths[0];
	var type = data === undefined ? 'unrender' : 'render';

	path = paths.slice(1).join('.');

	Global.binder.each(scope, path, function (binder) {
		Global.binder[type](binder);
	});

};

Model.prototype.run = function () {
	this.data = Observer.create(this.data, this.listener);
};

export default Model;
