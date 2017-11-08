import Observer from './observer';
import Utility from './utility';
import Global from './global';
import View from './view';
import Binder from './binder';

var Model = {};

Model.data = {};
Model.isRan = false;
Model.container = document.body;

Model.overwrite = function (data) {
	Observer(
		this.data = data,
		this.observer.bind(this)
	);
};

Model.listener = function (element) {
	var value = element.getAttribute('o-value');
	if (value) {
		var i, l;
		var path = value.replace(/(^(\w+\.?)+).*/, '$1');
		var container = Utility.getContainer(element);

		if (!container) return;
		
		var id = container.id;

		if (element.type === 'checkbox') {
			element.value = element.checked;
			Utility.setByPath(this.data[id], path, element.checked);
		} else if (element.nodeName === 'SELECT' && element.multiple) {
			var values = [];
			var options = element.options;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					values.push(option.value);
				}
			}
			Utility.setByPath(this.data[id], path, values);
		} else if (element.type === 'radio') {
			var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + path + '"]');
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				if (radio === element) {
					Utility.setByPath(this.data[id], path, i);
				} else {
					radio.checked = false;
				}
			}
		} else {
			Utility.setByPath(this.data[id], path, element.value);
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

Model.view = {};

Model.observer = function (data, path) {
	var paths = path.split('.');
	var id = paths[0];
	var type = data === undefined ? 'unrender' : 'render';

	path = paths.slice(1).join('.');

	// if (path) {
	// 	var element = document.getElementById(id);
	// 	// var element = document.body.querySelector('#' + id);
	// 	View.eachBinder(element, path, function (e, a) {
	// 		var options = {
	// 			element: e,
	// 			attribute: a,
	// 			container: element
	// 		};
	// 		var binder = new Binder(options);
	// 	});
	// }

	View.eachBinder(id, path, function (binder) {
		binder[type]();
	});
};

Model.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	Observer(
		this.data,
		this.observer.bind(this)
	);

	Global.inputs.push(this.input.bind(this));
	Global.changes.push(this.change.bind(this));
};

export default Model;
