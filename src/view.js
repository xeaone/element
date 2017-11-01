import OnceBinder from './once-binder';
import Utility from './utility';
import Binder from './binder';
import Global from './global';

var View = {};

View.data = {};
View.isRan = false;
View.container = document.body;

View.PATH = /\s?\|.*/;
View.PARENT_KEY = /^.*\./;
View.PARENT_PATH = /\.\w+$|^\w+$/;
View.PREFIX = /(data-)?o-/;
View.MODIFIERS = /^.*?\|\s?/;
View.IS_ACCEPT_PATH = /(data-)?o-.*/;
View.IS_REJECT_PATH = /(data-)?o-value.*/;

View.isOnce = function (attribute) {
	return attribute === 'data-o-value' || attribute === 'o-value';
};

View.isSkip = function (node) {
	return node.nodeName === 'J-VIEW'
		|| node.hasAttribute('o-view')
		|| node.hasAttribute('data-o-view');
};

View.isSkipChildren = function (node) {
	return node.nodeName === 'IFRAME'
		|| node.nodeName === 'OBJECT'
		|| node.nodeName === 'SCRIPT'
		|| node.nodeName === 'STYLE'
		|| node.nodeName === 'SVG';
};

View.isAccept = function (node) {
	var attributes = node.attributes;
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {
			return true;
		}
	}
	return false;
};

View.isAcceptAttribute = function (attribute) {
	return attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0;
};

View.createAttribute = function (name, value) {
	var attribute = {};

	attribute.name = name;
	attribute.value = value;
	attribute.path = attribute.value.replace(this.PATH, '');

	attribute.opts = attribute.path.split('.');
	attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');

	attribute.parentKey = attribute.path.replace(this.PARENT_KEY, '');
	attribute.parentPath = attribute.path.replace(this.PARENT_PATH, '');
	attribute.viewPath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;

	attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');

	return attribute;
};

View.eachAttribute = function (attributes, callback) {
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (this.isAcceptAttribute(attribute)) {
			callback(this.createAttribute(attribute.name, attribute.value));
		}
	}
};

View.eachAttributeAcceptPath = function (attributes, callback) {
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (!this.IS_REJECT_PATH.test(attribute.name) && this.IS_ACCEPT_PATH.test(attribute.name)) {
			callback(attribute.value.replace(this.PATH, ''));
		}
	}
};

View.eachElement = function (element, container, callback) {
	container = element.uid ? element : container;

	if (this.isAccept(element) && !this.isSkip(element)) {
		callback(element, container);
	}

	if (!this.isSkipChildren(element)) {
		for (element = element.firstElementChild; element; element = element.nextElementSibling) {
			this.eachElement(element, container, callback);
		}
	}
};

View.eachBinder = function (uid, path, callback) {
	var paths = this.data[uid];
	for (var key in paths) {
		if (key.indexOf(path) === 0) {
			var binders = paths[key];
			for (var i = 0; i < binders.length; i++) {
				callback(binders[i], i, binders, paths, key);
			}
		}
	}
};

View.has = function (uid, path, element) {
	if (!(uid in this.data) || !(path in this.data[uid])) return false;
	var binders = this.data[uid][path];
	for (var i = 0, l = binders.length; i < l; i++) {
		if (binders[i].element === element) return true;
	}
	return false;
};

View.push = function (uid, path, element, container, attribute) {
	if (!(uid in this.data)) this.data[uid] = {};
	if (!(path in this.data[uid])) this.data[uid][path] = [];
	this.data[uid][path].push(new Binder({
		element: element,
		container: container,
		attribute: attribute
	}));
};

View.add = function (addedNode, containerNode) {
	var self = this;
	self.eachElement(addedNode, containerNode, function (element, container) {
		self.eachAttribute(element.attributes, function (attribute) {
			if (self.isOnce(attribute.name)) {
				OnceBinder.bind(element, attribute, container);
			} else {
				if (container && container.uid) { // i dont like this check
					var path = attribute.viewPath;
					if (!self.has(container.uid, path, element)) {
						self.push(container.uid, path, element, container, attribute);
					}
				}
			}
		});
	});
};

View.remove = function (removedNode, containerNode) {
	var self = this;
	self.eachElement(removedNode, containerNode, function (element, container) {
		if (container && container.uid) { // i dont like this check
			self.eachAttributeAcceptPath(element.attributes, function (path) {
				self.eachBinder(container.uid, path, function (binder, index, binders, paths, key) {
					if (binder.element === element) {
						binder.unrender();
						binders.splice(index, 1);
						if (binders.length === 0) delete paths[key];
					}
				});
			});
		}
	});
};

View.observer = function (mutations) {
		var i = mutations.length;
		while (i--) {

			var l;
			var target = mutations[i].target;
			var addedNodes = mutations[i].addedNodes;
			var removedNodes = mutations[i].removedNodes;

			l = addedNodes.length;

			while (l--) {
				var addedNode = addedNodes[l];
				if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
					if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
					var containerNode = addedNode.uid || Utility.getContainer(target);
					this.add(addedNode, containerNode);
				}
			}

			l = removedNodes.length;

			while (l--) {
				var removedNode = removedNodes[l];
				if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
					if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
					var containerNode = removedNode.uid || Utility.getContainer(target);
					this.remove(removedNode, containerNode);
				}
			}

		}
};

View.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	this.add(this.container);
	Global.observers.push(this.observer.bind(this));
};

export default View;
