import Observer from './lib/observer';
import Utility from './lib/utility';
import Global from './global';

var Model = {};

Model.data = {};
Model.isSetup = false;
Model.container = document.body;

Model.overwrite = function (data) {
	Observer.create(
		this.data = data,
		this.observer.bind(this)
	);
};

Model.traverse = function (path) {
	return Utility.traverse(this.data, path, function (data, key, index, keys) {
		if (isNaN(keys[index+1])) {
			data.$set(key, {});
		} else {
			data.$set(key, []);
		}
	});
};

Model.get = function (keys) {
	var result = Utility.traverse(this.data, keys);
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

	if (path) {

		Global.view.eachBinder(uid, path, function (binder) {
			binder[type]();
		});

	}

};

Model.setup = function () {

	if (this.isSetup) {
		return;
	}

	this.isSetup = true;

	Observer.create(
		this.data,
		this.observer.bind(this)
	);

};

export default Model;
