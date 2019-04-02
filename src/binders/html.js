import View from '../view.js';

export default function (binder, data) {
	return {
		read () {

			if (data === undefined || data === null) {
				return false;
			} else if (typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (typeof data !== 'string') {
				data = String(data);
			}

		},
		write () {

			while (binder.target.firstChild) {
				const node = binder.target.removeNode(binder.target.firstChild);
				// View.removeContext(node);
			}

			const fragment = document.createDocumentFragment();
			const parser = document.createElement('div');

			parser.innerHTML = data;

			while (parser.firstElementChild) {
				View.addContext(parser.firstElementChild, {
					container: binder.container,
					scope: binder.container.scope
				});
				fragment.appendChild(parser.firstElementChild);
			}

			binder.target.appendChild(fragment);
		}
	};
};
