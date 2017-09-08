
export default function View (options) {
	this.isRan = false;
	this.setup(options);
}

View.prototype.setup = function (options) {
	options = options || {};
	this.data = options.data || {};
	this.container = options.container || document.body;
};

View.prototype.isOnce = function (node) {
	if (!node) return false;
	return node.hasAttribute('j-value') || node.hasAttribute('data-j-value');
};

View.prototype.isSkip = function (node) {
	if (!node) return false;
	return node.nodeName === 'J-VIEW'
		|| node.hasAttribute('j-view')
		|| node.hasAttribute('data-j-view');
};


View.prototype.isSkipChildren = function (node) {
	if (!node) return false;
	var name = node.nodeName;
	return node.uid !== undefined
		|| name === 'IFRAME'
		|| name === 'OBJECT'
		|| name === 'SCRIPT'
		|| name === 'STYLE'
		|| name === 'SVG';
};

View.prototype.isAccept = function (node) {
	if (!node) return false;
	var attributes = node.attributes;
	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = attributes[i];
		if (attribute.name.indexOf('j-') === 0 || attribute.name.indexOf('data-j-') === 0) {
			return true;
		}
	}
	return false;
};

View.prototype.path = function (value) {
	return value.replace(/( |\|).*/, '');
};

View.prototype.binder = function (node) {
	var container = Utility.getContainer(node);
	var uid = container.uid;
	// if (this.isOnceBinder(node)) {
	// 	OnceBinder.bind(node, attribute, container);
	// } else {
		var path = attribute.path;
		if (!this.has(uid, path, node)) {
			this.add(uid, path, new Binder({
				element: node,
				container: container,
				attribute: attribute
			}));
		}
	// }
};

View.prototype.add = function (nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (this.isSkip(node)) {
			continue;
		} else if (this.isSkipChildren(node)) {
			i += node.getElementsByTagName('*').length;
			this.binder(node);
		} else if (this.isAccept(node)) {
			this.binder(node);
		}
	}
};

View.prototype.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	this.add(this.container.getElementsByTagName('*'));

	this.observer = new MutationObserver(function (mutations) {
		var i, l, c, s, node, nodes;
		for (i = 0, l = mutations.length; i < l; i++) {
			nodes = mutations[i].addedNodes;
			for (c = 0, s = nodes.length; c < s; c++) {
				node = nodes[c];
				if (node.nodeType === 1) {
					this.addElements(node.getElementsByTagName('*'));
					this.addElement(node);
				}
			}
		}
	}.bind(this));

	this.observer.observe(this.container, { childList: true, subtree: true });
};
