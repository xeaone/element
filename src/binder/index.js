var Component = require('./component');
var Observer = require('./observer');
var Utility = require('./utility');

function Controller (data, callback) {
	this.doc = data.doc;
	this.name = data.name;
	this.view = data.view || {};
	this.model = data.model || {};
	this.modifiers = data.modifiers || {};

	this.sPrefix = data.prefix + '-';
	this.sValue = data.prefix + '-value';
	this.sFor = data.prefix + '-for-(.*?)="';
	this.sAccepts = data.prefix + '-' + '(.*?)="';
	this.sRejects = data.prefix + '-controller=|' + data.rejects;
	this.query = '[' + data.prefix + '-controller=' + data.name + ']';

	this.rPath = /(\s)?\|(.*?)$/;
	this.rModifier = /^(.*?)\|(\s)?/;

	this.rFor = new RegExp(this.sFor);
	this.rPrefix = new RegExp(this.sPrefix);
	this.rAccepts = new RegExp(this.sAccepts);
	this.rRejects = new RegExp(this.sRejects);

	this.scope = data.doc.querySelector(this.query);
	if (!this.scope) throw new Error('missing attribute s-controller ' + data.name);

	if (callback) callback.call(this);
}

Controller.prototype.insert = function (elements) {
	var self = this;

	Utility.eachElement(elements, self.rRejects, null, self.rAccepts, function (element, index) {
		var component = new Component(element, self);

		component.eachAttribute(self.rAccepts, function (attribute) {
			if (self.rFor.test(attribute.name)) index = index + 1;
			if (self.view[attribute.value]) self.view[attribute.value].push(component);
			else self.view[attribute.value] = [component];
			component.render(attribute);
		});
	});
};

Controller.prototype.render = function () {
	var self = this;

	self.model = Observer(self.model, function (path) {
		var paths = path.split('.');
		if (paths.length > 1 && !isNaN(paths.slice(-1))) {
			path = paths.slice(0, -1).join('.');
		}

		var components = self.view[path];
		if (components) {
			for (var i = 0, l = components.length, component; i < l; i++) {
				component = components[i];

				component.eachAttribute(self.sAccepts + path, function (attribute) {
					component.render(attribute);
				});
			}
		}
	});

	self.insert(self.scope.getElementsByTagName('*'));
};

module.exports = {
	prefix: 's',
	doc: document,
	controllers: {},
	rejects: 'iframe|object|script',
	controller: function (data, callback) {
		if (!data.name) throw new Error('Controller - name parameter required');

		data.doc = data.doc || this.doc;
		data.prefix = data.prefix || this.prefix;
		data.rejects = data.rejects || this.rejects;

		this.controllers[data.name] = new Controller(data, callback);
		if (!callback) this.controllers[data.name].render();
		return this.controllers[data.name];
	}
};
