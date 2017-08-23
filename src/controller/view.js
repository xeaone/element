import Collection from './collection';
import Binder from './binder';

export default function View (options) {
	var self = this;
	self.isRan = false;
	self.data = new Collection();
	self.controller = options.controller;
}

View.prototype.PATH = /\s?\|(.*?)$/;
View.prototype.PREFIX = /(data-)?j-/;
View.prototype.MODIFIERS = /^(.*?)\|\s?/;
View.prototype.ATTRIBUTE_ACCEPTS = /(data-)?j-/i;
View.prototype.ELEMENT_SKIPS = /^\w+(-\w+)+|iframe|object|script|style|svg/i;

View.prototype.attribute = function (name, value) {
	var self = this;
	var attribute = {};
	attribute.name = name;
	attribute.value = value;
	attribute.path = attribute.value.replace(self.PATH, '');
	attribute.opts = attribute.path.split('.');
	attribute.command = attribute.name.replace(self.PREFIX, '');
	attribute.cmds = attribute.command.split('-');
	attribute.key = attribute.opts.slice(-1);
	attribute.vpath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;
	attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(self.MODIFIERS, '').split(' ');
	return attribute;
};

View.prototype.nodeSkipsTest = function (node) {
	if (!node) return false;
	var self = this;
	return self.ELEMENT_SKIPS.test(node.nodeName);
};

View.prototype.nodeAcceptsTest = function (node) {
	if (!node) return false;
	var self = this;
	var attributes = node.attributes;
	for (var i = 0, l = attributes.length; i < l; i++) {
		if (self.ATTRIBUTE_ACCEPTS.test(attributes[i].name)) {
			return true;
		}
	}
	return false;
};

View.prototype.eachElement = function (elements, callback) {
	var self = this;
	// NOTE might throw an error if node list length changes
	for (var i = 0, l = elements.length; i < l; i++) {
		if (self.nodeSkipsTest(elements[i])) {
			i += elements[i].getElementsByTagName('*').length;
			callback(elements[i]);
		} else if (self.nodeAcceptsTest(elements[i])) {
			callback(elements[i]);
		}
	}
};

View.prototype.eachAttribute = function (element, callback) {
	var self = this, attributes = element.attributes, attribute;
	for (var i = 0, l = attributes.length; i < l; i++) {
		attribute = attributes[i];
		if (self.ATTRIBUTE_ACCEPTS.test(attribute.name)) {
			callback(self.attribute(attribute.name, attribute.value));
		}
	}
};

View.prototype.unrender = function (pattern) {
	var self = this;
	self.data.forEach(function (paths, path, id) {
		if (pattern.test(path)) {

			paths.forEach(function (binder, _, id) {
				binder.unrender();
				paths.remove(id);
			});

			if (paths.size() === 0) {
				self.data.remove(id);
			}

		}
	});
};

View.prototype.render = function (pattern) {
	var self = this;
	self.data.forEach(function (paths, path) {
		if (pattern.test(path)) {
			paths.forEach(function (binder) {
				binder.render();
			});
		}
	});
};

View.prototype.addElement = function (element) {
	var self = this;
	self.eachAttribute(element, function (attribute) {
		if (!self.data.has(attribute.vpath)) {
			self.data.set(attribute.vpath, new Collection());
		}
		self.data.get(attribute.vpath).push(new Binder({
			element: element,
			attribute: attribute,
			controller: self.controller,
		}));
	});
};

View.prototype.addElements = function (elements) {
	var self = this;
	self.eachElement(elements, function (element) {
		self.addElement(element);
	});
};

View.prototype.mutationListener = function (mutations) {
	var self = this, i, l, c, s, node, nodes;
	for (i = 0, l = mutations.length; i < l; i++) {
		nodes = mutations[i].addedNodes;
		for (c = 0, s = nodes.length; c < s; c++) {
			node = nodes[c];
			if (node.nodeType === 1) {
				self.addElements(node.getElementsByTagName('*'));
				self.addElement(node);
			}
		}
	}
};

View.prototype.inputListener = function (element) {
	var self = this, value = element.getAttribute('j-value');
	if (value) {
		var attribute = self.attribute('j-value', value);
		self.data.get(attribute.path).find(function (binder) {
			return binder.element === element;
		}).updateModel();
	}
};

View.prototype.run = function () {
	var self = this;

	if (self.isRan) return;
	else self.isRan = true;

	self.controller._view.addEventListener('change', function (e) {
		if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
			self.inputListener.call(self, e.target);
		}
	}, true);

	self.controller._view.addEventListener('input', function (e) {
		self.inputListener.call(self, e.target);
	}, true);

	self.addElements(self.controller._view.getElementsByTagName('*'));

	self.observer = new MutationObserver(self.mutationListener.bind(self));

	self.observer.observe(self.controller._view, {
		childList: true,
		subtree: true
	});
};
