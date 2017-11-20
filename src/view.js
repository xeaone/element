import OnceBinder from './lib/once-binder';
import Utility from './lib/utility.js';
import Binder from './lib/binder.js';
import Global from './global.js';

var View = {};

View.data = {};
View.isSetup = false;
View.container = document.body;

View.PREFIX = /(data-)?o-/;
View.IS_ACCEPT_PATH = /(data-)?o-.*/;
View.IS_REJECT_PATH = /(data-)?o-value.*/;

// delete this
View.createAttribute = function (name, value) {
	var attribute = {};

	attribute.name = name;
	attribute.value = value;

	attribute.path = Utility.binderPath(attribute.value);
	attribute.modifiers = Utility.binderModifiers(attribute.value);

	attribute.keys = attribute.path.split('.');
	attribute.opts = attribute.keys;
	attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');

	attribute.type = attribute.cmds[0];

	return attribute;
};

View.hasAcceptAttribute = function (element) {
	var attributes = element.attributes;

	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];

		if (
			attribute.name.indexOf('o-') === 0
			|| attribute.name.indexOf('data-o-') === 0
		) {
			return true;
		}

	}

	return false;
};

View.eachAttribute = function (element, callback) {
	var attributes = element.attributes;

	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];

		if (
			attribute.value
			&& attribute.name.indexOf('o-') === 0
			|| attribute.name.indexOf('data-o-') === 0
			&& attribute.name !== 'o-method'
			&& attribute.name !== 'o-action'
			&& attribute.name !== 'o-external'
			&& attribute.name !== 'data-o-action'
			&& attribute.name !== 'data-o-method'
			&& attribute.name !== 'data-o-external'
		) {
			callback.call(this, attribute);
		}

	}

};

View.eachBinder = function (uid, path, callback) {
	var paths = this.data[uid];

	for (var key in paths) {

		if (key.indexOf(path) === 0) {
			var binders = paths[key];

			for (var i = 0, l = binders.length; i < l; i++) {
				var binder = binders[i];
				callback.call(this, binder, i, binders, paths, key);
			}

		}

	}

};

View.addBinder = function (uid, path, binder) {

	if (!(uid in this.data)) {
		this.data[uid] = {};
	}

	if (!(path in this.data[uid])) {
		this.data[uid][path] = [];
	}

	this.data[uid][path].push(binder);
};

View.eachElement = function (element, callback, container) {

	if (
		element.nodeName !== 'O-VIEW'
		&& !element.hasAttribute('o-view')
		&& !element.hasAttribute('o-external')
		&& !element.hasAttribute('data-o-view')
		&& !element.hasAttribute('data-o-external')
		&& this.hasAcceptAttribute(element)
	) {

		if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) {
			container = element;
		} else if (!document.body.contains(element)) {
			container = Utility.getContainer(container);
		} else if (!container) {
			container = Utility.getContainer(element);
		}

		var uid = container.getAttribute('o-uid') || container.getAttribute('data-o-uid');

		callback.call(this, element, container, uid);
	}

	if (
		element.nodeName !== 'SVG'
		& element.nodeName !== 'STYLE'
		& element.nodeName !== 'SCRIPT'
		& element.nodeName !== 'OBJECT'
		& element.nodeName !== 'IFRAME'
	) {

		for (var i = 0, l = element.children.length; i < l; i++) {
			this.eachElement(element.children[i], callback, container);
		}

	}

};

View.addElement = function (addedElement) {
	this.eachElement(addedElement, function (element, container, uid) {
		this.eachAttribute(element, function (attribute) {
			// if (
			// 	attribute.name.indexOf('o-on') === 0
			// 	|| attribute.name.indexOf('o-each') === 0
			// 	|| attribute.name.indexOf('o-value') === 0
			// ) {
				OnceBinder.render({
					uid: uid,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			// } else {
				// var att = this.createAttribute(attribute.name, attribute.value);
				// this.addBinder(uid, att.path, new Binder({
				// 	uid: uid,
				// 	element: element,
				// 	container: container,
				// 	attribute: att
				// }));
			// }
		});
	});
};

View.removeElement = function (removedElement, target) {
	this.eachElement(removedElement, function (element, container, uid) {
		this.eachAttribute(element, function (attribute) {
			// if (
			// 	attribute.name.indexOf('o-on') === 0
			// 	|| attribute.name.indexOf('o-each') === 0
			// 	|| attribute.name.indexOf('o-value') === 0
			// ) {
				OnceBinder.unrender({
					uid: uid,
					element: element,
					container: container,
					name: attribute.name,
					value: attribute.value
				});
			// } else {
				// var att = this.createAttribute(attribute.name, attribute.value);
				// this.eachBinder(uid, att.path, function (binder, index, binders, paths, key) {
				// 	if (binder.element === element) {
				// 		binder.unrender();
				// 		binders.splice(index, 1);
				// 		if (binders.length === 0) {
				// 			delete paths[key];
				// 		}
				// 	}
				// });
			// }
		});
	}, target);
};

View.mutation = function (mutations) {
	var c, i = mutations.length;

	while (i--) {
		var target = mutations[i].target;
		var addedNodes = mutations[i].addedNodes;
		var removedNodes = mutations[i].removedNodes;

		c = addedNodes.length;

		while (c--) {
			var addedNode = addedNodes[c];

			if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {

				if (addedNode.isRouterComponent) {
					addedNode.inRouterCache = true;
				}

				this.addElement(addedNode);
			}

		}

		c = removedNodes.length;

		while (c--) {
			var removedNode = removedNodes[c];

			if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {

				if (removedNode.isRouterComponent) {
					removedNode.inRouterCache = true;
				}

				this.removeElement(removedNode, target);
			}

		}

	}

};

View.setup = function () {

	if (this.isSetup) {
		return;
	}

	this.isSetup = true;

	this.addElement(this.container);

	Global.mutations.push(this.mutation.bind(this));
};

export default View;
