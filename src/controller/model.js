import Observer from './observer';

export default function Model (options) {
	var self = this;
	self.isRan = false;
	self.controller = options.controller;
}

Model.prototype.listener = function (data, path) {
	var self = this;
	var pattern = new RegExp('^' + path);

	if (data === undefined) {
		self.controller.view.unrender(pattern);
	} else {
		self.controller.view.render(pattern);
	}
};

Model.prototype.overwrite = function (data) {
	var self = this;

	self.data = data;

	Observer(
		self.data,
		self.listener.bind(self)
	);
};

Model.prototype.run = function () {
	var self = this;

	if (self.isRan) return;
	else self.isRan = true;

	self.data = self.controller._model;

	Observer(
		self.data,
		self.listener.bind(self)
	);
};
