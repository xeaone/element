
var KEBAB = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g;

function toKebabCase (data) {
	return data.replace(this.KEBAB, function (match) {
		return '-' + match.toLowerCase();
	});
}

function n (type, attributes, children) {
	var attributes = (arguments[1].constructor === Object ? arguments[1] : ) || undefined;
	var node = document.createElement(type);

	for (var attribute in attributes) {
		node.setAttribute(toKebabCase(attribute), attributes[attribute]);
	}

	for (var i = 0, l = children.length; i < l; i++) {
		if (typeof children[i] === 'string') {
			children[i] = document.createTextNode(children[i]);
		}
		node.appendChild(children[i]);
	}

	return node;
}

function createElement (data) {
	if (typeof data === 'string') {
		return document.createTextNode(data);
	} else {
		var node = document.createElement(data.type);

		var attributes = data.attributes;
		for (var attribute in attributes) {
			node.setAttribute(toKebabCase(attribute), attributes[attribute]);
		}
		// if (attributes) {
		// }

		var children = data.children;
		for (var i = 0, l = children.length; i < l; i++) {
			node.appendChild(createElement(children[i]));
		}
		// if (children) {
		// }

		return node;
	}
}

function changed (node1, node2) {
	return typeof node1 !== typeof node2
		|| typeof node1 === 'string'
		&& node1 !== node2
		|| node1.type !== node2.type;
}

function updateElement (parent, newNode, oldNode, index) {
	index = index || 0;
	if (!oldNode) {
		parent.appendChild(
			n(newNode)
		);
	} else if (!newNode) {
		parent.removeChild(
			parent.childNodes[index]
		);
	} else if (changed(newNode, oldNode)) {
		parent.replaceChild(
			n(newNode),
			parent.childNodes[index]
		);
	} else if (newNode.type) {
		var newLength = newNode.children.length;
		var oldLength = oldNode.children.length;
		for (var i = 0; i < newLength || i < oldLength; i++) {
			updateElement(
				parent.childNodes[index],
				newNode.children[i],
				oldNode.children[i],
				i
			);
		}
	}
}

// ---------------------------------------------------------------------

// var a = {
// 	type: 'ul',
// 	children: [
// 		{
// 			type: 'li',
// 			children: ['foo']
// 		},
// 		{
// 			type: 'li',
// 			children: ['foo']
// 		}
// 	]
// };

var b = {
	type: 'ul',
	children: [
		{
			type: 'li',
			children: ['bar']
		},
		{
			type: 'li',
			children: ['bar']
		}
	]
};

var a = n('ul', [
	n('li', ['bar']),
	n('li', ['bar'])
]);

var b = n('ul', [
	n('li', ['foo']),
	n('li', ['foo'])
]);

var root = document.getElementById('root');
var reload = document.getElementById('reload');

updateElement(root, a);

reload.addEventListener('click', () => {
	updateElement(root, b, a);
});
