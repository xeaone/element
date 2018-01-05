import Global from './global';

var View = {};

View.data = {};
View.isRan = false;
View.container = document.body;

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
			&& attribute.name !== 'o-uid'
			&& attribute.name !== 'o-auth'
			&& attribute.name !== 'o-reset'
			&& attribute.name !== 'o-method'
			&& attribute.name !== 'o-action'
			&& attribute.name !== 'o-external'
			&& attribute.name !== 'data-o-uid'
			&& attribute.name !== 'data-o-auth'
			&& attribute.name !== 'data-o-reset'
			&& attribute.name !== 'data-o-method'
			&& attribute.name !== 'data-o-action'
			&& attribute.name !== 'data-o-external'
			&& (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0)
		) {
			callback.call(this, attribute);
		}

	}

};

View.each = function (element, callback, container) {

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
			container = Global.utility.getContainer(container);
		} else if (!container) {
			container = Global.utility.getContainer(element);
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
			this.each(element.children[i], callback, container);
		}

	}

};

View.add = function (addedElement) {
	this.each(addedElement, function (element, container, uid) {
		this.eachAttribute(element, function (attribute) {
			Global.binder.render({
				uid: uid,
				element: element,
				container: container,
				name: attribute.name,
				value: attribute.value
			});
		});
	});
};

View.remove = function (removedElement, target) {
	this.each(removedElement, function (element, container, uid) {
		this.eachAttribute(element, function (attribute) {
			Global.binder.unrender({
				uid: uid,
				element: element,
				container: container,
				name: attribute.name,
				value: attribute.value
			});
		});
	}, target);
};

View.run = function () {

	if (this.isRan) {
		return;
	}

	this.isRan = true;

	this.add(this.container);
};

export default View;
