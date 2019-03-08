import Utility from '../utility.js';

// const TIME = 15;

export default function (binder, data) {

	if (!binder.meta.template && !binder.target.children.length) {
		return;
	}

	if (!binder.meta.fragment) {
		binder.meta.fragment = document.createDocumentFragment();
	}

	if (!binder.meta.template) {
		binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
	}

	let add, remove;
	const self = this;

	return {
		read () {

			if (!data || typeof data !== 'object') data = [];

			const keys = Object.keys(data);
			let dataLength = keys.length;
			let nodeLength = binder.meta.fragment.children.length + binder.target.children.length;

			// const time = window.performance.now();

			if (nodeLength === dataLength) {
				return false;
			} else if (nodeLength > dataLength) {
				remove = nodeLength - dataLength;

				while (binder.meta.fragment.children.length && remove--) {
					binder.meta.fragment.removeChild(binder.meta.fragment.lastElementChild);
					// if (performance.now() - time > TIME) return;
				}

			} else if (nodeLength < dataLength) {
				add = dataLength - nodeLength;

				while (nodeLength < dataLength) {

					const clone = document.importNode(binder.meta.template, true);
					const key = keys[nodeLength];
					// Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
					binder.meta.fragment.appendChild(clone);
					nodeLength++;

					// if (performance.now() - time > TIME) return;
				}

			}

		},
		write () {

			if (remove) {
				// const time = window.performance.now();
				while (binder.target.children.length && remove--) {
					binder.target.removeChild(binder.target.lastElementChild);
					// if (performance.now() - time > TIME) break;
				}
			} else if (add) {
				binder.target.appendChild(binder.meta.fragment);
			}

			// console.log(data.length);
			// console.log(binder.target.children.length);

			if (binder.target.children.length !== data.length) {
				self.default(binder, data);
			}

		}
	};
};
