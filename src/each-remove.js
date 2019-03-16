// import Binder from './binder.js';
import View from './view.js';

// export default function EachRemove (node, variable, path, key, container) {
export default function EachRemove (node) {

	// if (node.nodeType === 3) {
	// } else
	if (node.nodeType === 1) {
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

			View.remove(node);

			break;
		}
	}

	let child = node.firstChild;

	while (child) {
	    EachRemove(child);
	    child = child.nextSibling;
	}

};
