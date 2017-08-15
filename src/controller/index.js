import Utility from '../utility';
import Binder from './binder';
import Model from './model';
import View from './view';

export default function Controller (options, callback) {
	var self = this;

	self.view = new View();
	self.model = new Model();

	self.element = (options.view.shadowRoot || options.view);
	self.events = options.events || {};
	self._model = options.model || {};
	self._view = self.element.querySelectorAll('*');

	self.name = options.name;
	self.modifiers = options.modifiers || {};

	self.model.listener(function (path) { // , data
		// if (data === undefined) {
		// 	self.view.unrenderAll('^' + path + '.*');
		// } else {
		// 	self.view.renderAll('^' + path);
		// }
		self.view.renderAll('^' + path);
	});

	self.view.listener(function (element, attribute) {
		self.view.data.get(attribute.path).push(new Binder({
			view: self.view,
			model: self.model,
			events: self.events,
			element: element,
			attribute: attribute,
			modifiers: attribute.modifiers.map(function (modifier) {
				return self.modifiers[modifier];
			})
		}));
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
		self._model.call(self, function (model) {
			self._model = model;
			self.model.run(self._model);
			self.view.run(self._view);
			if (callback) return callback.call(self);
		});
	} else {
		self.model.run(self._model);
		self.view.run(self._view);
		if (callback) callback.call(self);
	}

}
