import Model from './model';
import View from './view';

export default function Controller (options, callback) {
	var self = this;

	self.name = options.name || '';
	self.events = options.events || {};
	self.modifiers = options.modifiers || {};

	self._model = options.model || {};
	self._view = (options.view.shadowRoot || options.view);

	self.view = new View();
	self.model = new Model();

	// self.view = new View({
	// 	controller: self
	// });
	//
	// self.model = new Model({
	// 	controller: self
	// });

	if (typeof self._model === 'function') {
		self._model.call(self, function (model) {
			self._model = model;
			self.model.run();
			self.view.run();
			if (callback) callback.call(self);
		});
	} else {
		self.model.run();
		self.view.run();
		if (callback) callback.call(self);
	}

}

Controller.prototype.register = function () {

};

// Controller.prototype.mutationListener = function (mutations) {
// 	var self = this, i, l, c, s, node, nodes;
// 	for (i = 0, l = mutations.length; i < l; i++) {
// 		nodes = mutations[i].addedNodes;
// 		for (c = 0, s = nodes.length; c < s; c++) {
// 			node = nodes[c];
// 			if (node.nodeType === 1) {
// 				self.view.addElements(node.getElementsByTagName('*'));
// 				self.view.addElement(node);
// 			}
// 		}
// 	}
// };
//
// Controller.prototype.inputListener = function (element) {
// 	var self = this, value = element.getAttribute('j-value');
// 	if (value) {
// 		var attribute = self.view.attribute('j-value', value);
// 		self.view.data.get(attribute.path).find(function (binder) {
// 			return binder.element === element;
// 		}).updateModel();
// 	}
// };
//
// Controller.prototype.run = function () {
// 	var self = this;
//
// 	if (self.isRan) return;
// 	else self.isRan = true;
//
// 	self.controller._view.addEventListener('change', function (e) {
// 		if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
// 			self.inputListener.call(self, e.target);
// 		}
// 	}, true);
//
// 	self.controller._view.addEventListener('input', function (e) {
// 		self.inputListener.call(self, e.target);
// 	}, true);
//
// 	self.addElements(self.controller._view.getElementsByTagName('*'));
// 	self.observer = new MutationObserver(self.mutationListener.bind(self));
// 	self.observer.observe(self.controller._view, { childList: true, subtree: true });
// };
