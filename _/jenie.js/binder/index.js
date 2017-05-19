var Utility = require('../utility');
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

	self._model.on('change', function (path, data, key) {
		console.log(path);
		console.log(data[key]);

		if (data[key] === undefined) {
			self._view.removeAll('^' + path + '.*');
		} else {
			self._view.renderAll(path, data);
		}
	});

	// self._view.on('add', function (element, attribute) {
	// 	var path = attribute.opts.slice(0, -1).join('.');
	//
	// 	self._view.data[attribute.path].push(Unit({
	// 		view: self._view,
	// 		element: element,
	// 		attribute: attribute,
	// 		_data: path === '' ? self._model.data : Utility.getByPath(self._model.data, path),
	// 		modifiers: attribute.modifiers.map(function (modifier) {
	// 			return self.modifiers[modifier];
	// 		})
	// 	}));
	//
	// });

	// self._model.data.items.unshift({ hello: 'world' });
	// self._model.data.items.splice(-1, 1, { hello: 'world' });
	// console.log(r);
	// console.log(self._model);
	// throw 'stop'

	self._model.setup(options.model || {});
	self._view.setup((options.view.shadowRoot || options.view).querySelectorAll('*'));

	self.view = self._view.data;
	self.model = self._model.data;

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
