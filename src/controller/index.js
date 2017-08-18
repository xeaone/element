import Utility from '../utility';
import Model from './model';
import View from './view';

export default function Controller (options, callback) {
	var self = this;

	self.view = new View({
		controller: self
	});

	self.model = new Model({
		controller: self
	});

	self.events = options.events || {};
	self.element = (options.view.shadowRoot || options.view);

	self.name = options.name;
	self.modifiers = options.modifiers || {};

	self.model.setListener(function (data, path) {
		if (data === undefined) {
			self.view.unrenderAll('^' + path + '.*');
		} else {
			self.view.renderAll('^' + path);
		}
	});

	self.inputHandler = function (element) {
		if (element.hasAttribute('j-value')) {
			var attribute = Utility.attribute('j-value', element.getAttribute('j-value'));
			self.view.data.get(attribute.path).find(function (binder) {
				return binder.element === element;
			}).updateModel();
		}
	};

	self.element.addEventListener('change', function (e) {
		if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
			self.inputHandler(e.target);
		}
	}, true);

	self.element.addEventListener('input', function (e) {
		self.inputHandler(e.target);
	}, true);

	if (typeof options.model === 'function') {
		options.model.call(self, function (model) {
			self.model.setData(model || {});
			self.view.setElement(self.element);
			self.model.run();
			self.view.run();
			if (callback) callback.call(self);
		});
	} else {
		self.model.setData(options.model || {});
		self.view.setElement(self.element);
		self.model.run();
		self.view.run();
		if (callback) callback.call(self);
	}

}
