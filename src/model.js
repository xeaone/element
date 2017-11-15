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

Model.listener = function (element) {
	var value = element.getAttribute('o-value');
	if (value) {
		var i, l;
		var container = Utility.getContainer(element);
		var uid = container.getAttribute('o-uid');
		var path = value.replace(/(^(\w+\.?)+).*/, '$1');
		var result = this.traverse(uid + '.' + path);

		if (element.type === 'checkbox') {
			result.data[result.key] = element.value = element.checked;
		} else if (element.nodeName === 'SELECT' && element.multiple) {
			var values = [];
			var options = element.options;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					values.push(option.value);
				}
			}
			result.data[result.key] = values;
		} else if (element.type === 'radio') {
			var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				if (radio === element) {
					radio.checked = true;
					result.data[result.key] = i;
				} else {
					radio.checked = false;
				}
			}
		} else {
			result.data[result.key] = element.value;
		}
	}
};

Model.input = function (e) {
	if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.nodeName !== 'SELECT') {
		this.listener.call(this, e.target);
	}
};

Model.change = function (e) {
	this.listener.call(this, e.target);
};

Model.observer = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var type = data === undefined ? 'unrender' : 'render';

	path = paths.slice(1).join('.');
	// console.log(path);

	if (path) {
		Global.view.eachBinder(uid, path, function (binder) {
			binder[type]();
		});
	}

};

Model.setup = function () {
	if (this.isSetup) {
		return;
	} else {
		this.isSetup = true;
	}

	Observer.create(
		this.data,
		this.observer.bind(this)
	);

	Global.inputs.push(this.input.bind(this));
	Global.changes.push(this.change.bind(this));
};

export default Model;
