var Model = require('./model');
var View = require('./view');
var Unit = require('./unit');

function Binder () {}

Binder.prototype.setup = function (options) {
	var self = this;

	self._view = View();
	self._model = Model();
	self.name = options.name;
	self.modifiers = options.modifiers || {};

	self._model.on('change', function (path, data) {
		if (data === undefined) {
			self._view.unrenderAll('^' + path + '.*');
		} else {
			self._view.renderAll('^' + path);
		}
	});

	self._view.on('add', function (element, attribute) {

		self._view.data.get(attribute.path).push(Unit({
			view: self._view,
			model: self._model,
			element: element,
			attribute: attribute,
			modifiers: attribute.modifiers.map(function (modifier) {
				return self.modifiers[modifier];
			})
		}));

	});

	self._model.setup(options.model || {});
	self._view.setup((options.view.shadowRoot || options.view).querySelectorAll('*'));

	self.model = self._model.data;
	self.view = self._view.data;

	return self;
};

Binder.prototype.create = function (options, callback) {
	var self = this;

	if (options.model && typeof options.model === 'function') {
		options.model.call(self, function (model) {
			options.model = model;
			self.setup(options);
			if (callback) return callback.call(self);
		});
	} else {
		self.setup(options);
		if (callback) return callback.call(self);
	}

	return self;
};

module.exports = function (options, callback) {
	return new Binder().create(options, callback);
};
