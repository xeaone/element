import Observer from './lib/observer';
import Traverse from './lib/traverse';
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

Model.get = function (keys) {
	var result = Traverse({
		keys: keys,
		// create: false,
		data: this.data
	});

	if (result) {
		return result.data[result.key];
	} else {
		return undefined;
	}
};

Model.set = function (keys, value) {
	var result = Traverse({
		keys: keys,
		// create: true,
		data: this.data
	});

	return result.data[result.key] = value;
};

Model.ensureSet = function (keys, value) {
	var result = Traverse({
		keys: keys,
		create: true,
		data: this.data
	});

	return result.data.$set(result.key, value);
};

Model.ensureGet = function (keys) {
	var result = Traverse({
		keys: keys,
		create: true,
		data: this.data
	});

	if (result.data[result.key] === undefined) {
		return result.data.$set(result.key, null);
	} else {
		return result.data[result.key];
	}
};

Model.listener = function (element) {
	var value = element.getAttribute('o-value');
	if (value) {
		var i, l;
		var path = value.replace(/(^(\w+\.?)+).*/, '$1');
		var container = Utility.getContainer(element);

		if (!container) return;

		var uid = container.getAttribute('o-uid');

		if (element.type === 'checkbox') {
			element.value = element.checked;
			Utility.setByPath(this.data[uid], path, element.checked);
		} else if (element.nodeName === 'SELECT' && element.multiple) {
			var values = [];
			var options = element.options;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					values.push(option.value);
				}
			}
			Utility.setByPath(this.data[uid], path, values);
		} else if (element.type === 'radio') {
			var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				if (radio === element) {
					Utility.setByPath(this.data[uid], path, i);
				} else {
					radio.checked = false;
				}
			}
		} else {
			Utility.setByPath(this.data[uid], path, element.value);
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
	console.log(path);

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
