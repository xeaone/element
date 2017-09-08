import Model from './model';
import View from './view';

export default function Controller (options, callback) {
	var self = this;

	self.name = options.name || '';
	self.events = options.events || {};
	self.modifiers = options.modifiers || {};

	self._model = options.model || {};
	self._view = (options.view.shadowRoot || options.view);

	self.view = new View({
		controller: self
	});

	self.model = new Model({
		controller: self
	});

	if (typeof self._model === 'function') {
		self._model.call(self, function (model) {
			self._model = model;
			self.model.run();
			self.view.run();
			if (callback) callback.call(self);
		});
	} else {
		self.model.run();
		self.view.run();
		if (callback) callback.call(self);
	}

}
