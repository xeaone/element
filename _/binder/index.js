var Component = require('./component');
var Observer = require('./observer');
var Utility = require('./utility');

function Binder (data, callback) {
	this.name = data.name;
	this.scope = data.scope;
	this.view = data.view || {};
	this.model = data.model || {};
	this.doc = data.doc || document;
	this.prefix = data.prefix || 'j';
	this.modifiers = data.modifiers || {};

	this.sPrefix = this.prefix + '-';
	this.sValue = this.prefix + '-value';
	this.sFor = this.prefix + '-for-(.*?)="';
	this.sAccepts = this.prefix + '-' + '(.*?)="';
	this.sRejects = this.prefix + '-controller=|<\w+-\w+|iframe|object|script';
	this.query = '[' + this.prefix + '-controller=' + this.name + ']';

	this.rPath = /(\s)?\|(.*?)$/;
	this.rModifier = /^(.*?)\|(\s)?/;

	this.rFor = new RegExp(this.sFor);
	this.rPrefix = new RegExp(this.sPrefix);
	this.rAccepts = new RegExp(this.sAccepts);
	this.rRejects = new RegExp(this.sRejects);

	// || data.doc.querySelector(this.query);
	// if (!this.scope) throw new Error('missing attribute options.scope or ' + this.prefix + '-controller ');

	if (callback) callback.call(this);
}

Binder.prototype.insert = function (elements) {
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

Binder.prototype.render = function () {
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

module.exports = function (data, callback) {
	var binder = new Binder(data, callback);
	binder.render();
	return binder;
};
