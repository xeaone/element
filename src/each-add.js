import Utility from './utility.js';
import Binder from './binder.js';
import Piper from './piper.js';
import View from './view.js';

const PathPattern = new RegExp('(\\$)(\\w+)($|,|\\s+|\\.|\\|)', 'ig');
const KeyPattern = new RegExp('({{\\$)(\\w+)((-(key|index))?}})', 'ig');

export default function EachAdd (node, variable, path, key, container) {

	if (node.nodeType === 3) {
		node.nodeValue = node.nodeValue.replace(KeyPattern, `${key}`);
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

			attribute.value = attribute.value.replace(KeyPattern, `${key}`);
			attribute.value = attribute.value.replace(PathPattern, `${path}.${key}$3`);

			const binder = Binder.create({
				target: node,
				container: container,
				name: attribute.name,
				value: attribute.value,
				scope: container.scope
			});

			View.add(binder);

			let data;

			if (binder.type === 'on') {
				data = Utility.getByPath(container.methods, binder.values);
			} else {
				data = Utility.getByPath(container.model, binder.values);
				data = Piper(binder, data);
			}

			Binder.render(binder, data);
		}
	}

	let child = node.firstChild;

	while (child) {
	    EachAdd(child, variable, path, key, container);
	    child = child.nextSibling;
	}

};
