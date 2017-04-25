var PATH = /(\s)?\|(.*?)$/;
var PREFIX = /(data-)?j-/;

function View () {}

View.prototype.glance = function (element) {
	return element.outerHTML
	.replace(/(\/)?>.*$/, '')
	.replace(/^</, '');
};

View.prototype.eachElement = function (elements, reject, accept, callback) { //skip,
	var element, glance, i;

	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		glance = this.glance(element);

		if (reject && reject.test(glance)) {
			i += element.children.length;
		// } else if (skip && skip.test(glance)) {
		// 	continue;
		} else if (accept && accept.test(glance)) {
			callback(element);
		}
	}
};

View.prototype.eachAttribute = function (element, pattern, callback) {
	var attribute = {}, i;

	for (i = 0; i < element.attributes.length; i++) {
		attribute.name = element.attributes[i].name;
		attribute.value = element.attributes[i].value;
		attribute.path = attribute.value.replace(PATH, '');
		attribute.opts = attribute.path.split('.');
		attribute.command = attribute.name.replace(PREFIX, '');
		attribute.cmds = attribute.command.split('-');

		if (pattern.test(attribute.name)) {
			callback(attribute);
		}

	}
};

View.prototype.create = function (elements, reject, accept, callback) {
	var self = this, view = {};

	self.eachElement(elements, reject, accept, function (element) {
		self.eachAttribute(element, accept, function (attribute) {
			if (!(attribute.path in view)) view[attribute.path] = [];
			view[attribute.path].push(callback(element, attribute));
		});
	});

	return view;
};

module.exports = function (elements, reject, accept, callback) {
	return new View().create(elements, reject, accept, callback);
};
