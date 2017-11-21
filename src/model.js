import Observer from './lib/observer';
import Global from './global';

var Model = {};

Model.data = {};
Model.isRan = false;
Model.container = document.body;

Model.overwrite = function (data) {
	Observer.create(
		this.data = data,
		this.observer.bind(this)
	);
};

Model.traverse = function (path) {
	return Global.utility.traverse(this.data, path, function (data, key, index, keys) {
		if (isNaN(keys[index+1])) {
			data.$set(key, {});
		} else {
			data.$set(key, []);
		}
	});
};

Model.get = function (keys) {
	var result = Global.utility.traverse(this.data, keys);
	return result ? result.data[result.key] : undefined;
};

Model.set = function (keys, value) {
	value = value === undefined ? null : value;
	var result = this.traverse(keys);
	return result.data.$set(result.key, value);
};

Model.ensure = function (keys, value) {
	var result = this.traverse(keys);

	if (result.data[result.key] === undefined) {
		return result.data.$set(result.key, value || null);
	} else {
		return result.data[result.key];
	}

};

Model.observer = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var type = data === undefined ? 'unrender' : 'render';

	path = paths.slice(1).join('.');

	if (!path) return;

	Global.binder.each(uid, path, function (binder) {
		Global.binder[type](binder);
	});

};

Model.run = function () {

	if (this.isRan) {
		return;
	}

	this.isRan = true;

	Observer.create(
		this.data,
		this.observer.bind(this)
	);

};

export default Model;
