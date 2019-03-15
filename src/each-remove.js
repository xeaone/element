import Binder from './binder.js';
import Piper from './piper.js';
import Model from './model.js';
import View from './view.js';
import Data from './data.js';

export default function EachRemove (node, variable, path, key, container) {

	if (node.nodeType === 3) {
	} else if (node.nodeType === 1) {
		for (let i = 0, l = node.attributes.length; i < l; i++) {
			const attribute = node.attributes[i];

			if (
				attribute.name.indexOf('o-') !== 0 ||
				attribute.name === 'o-scope' ||
				attribute.name === 'o-reset' ||
				attribute.name === 'o-action' ||
				attribute.name === 'o-method' ||
				attribute.name === 'o-enctype'
			) {
				continue
			}
			//
			// const binder = Binder.create({
			// 	target: node,
			// 	container: container,
			// 	name: attribute.name,
			// 	value: attribute.value,
			// 	scope: container.scope
			// });

			Data.remove(node);
			// Binder.remove(binder);
		}
	}

	let child = node.firstChild;

	while (child) {
	    EachRemove(child, variable, path, key, container);
	    child = child.nextSibling;
	}

};
