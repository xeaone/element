import Utility from '../utility.js';
import Batcher from '../batcher.js';

// const TIME = 15;

export default function (binder, data) {

	if (data.length === undefined) {
		console.log('data.length undefined');
		return;
	}

	if (!binder.meta.template && !binder.target.children.length) {
		return;
	}

	// if (binder.meta.busy) {
	// 	return;
	// } else {
	// 	binder.meta.busy = true;
	// }

	// if (!binder.meta.fragment) {
	// 	binder.meta.fragment = document.createDocumentFragment();
	// }

	if (binder.meta.length === undefined) {
		binder.meta.length = 0;
	}

	if (!binder.meta.template) {
		binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
	}

	const self = this;

	return {
		read () {
			// need to account for Objet
			// this.currentLength = binder.target.children.length;
			this.currentLength = binder.meta.length;
			this.targetLength = typeof data === 'object' ? data.length : 0;

			if (this.currentLength === this.targetLength) {
				return false;
			} else if (this.currentLength > this.targetLength) {
				binder.meta.length--;
				this.currentLength--;
			} else if (this.currentLength < this.targetLength) {
				binder.meta.length++;
				this.currentLength++;
			}

			// if (currentLength === targetLength) {
			// 	return false;
			// } else if (currentLength > targetLength) {
			// 	// binder.meta.length--;
			// 	this.remove = binder.target.lastElementChild;
			// } else if (currentLength < targetLength) {
			// 	// binder.meta.length++;
			// 	this.add = document.importNode(binder.meta.template, true);
			// }

			// let dataLength = this.keys.length;
			// // let nodeLength = binder.meta.fragment.children.length + binder.target.children.length;
			// const nodeLength = function () {
			// 	return binder.meta.fragment.children.length + binder.target.children.length;
			// };
			//
			// // const time = window.performance.now();
			//
			// if (nodeLength === dataLength) {
			// 	return false;
			// } else if (nodeLength > dataLength) {
			// 	this.remove = nodeLength - dataLength;
			//
			// 	while (binder.meta.fragment.children.length && this.remove--) {
			// 		binder.meta.fragment.removeChild(binder.meta.fragment.lastElementChild);
			// 		// if (performance.now() - time > TIME) return;
			// 	}
			//
			// } else if (nodeLength < dataLength) {
			// 	this.add = dataLength - nodeLength;
			//
			// 	while (nodeLength < dataLength) {
			//
			// 		const clone = document.importNode(binder.meta.template, true);
			// 		const key = this.keys[nodeLength];
			// 		// Utility.replaceEachVariable(clone, binder.names[1], binder.path, key);
			// 		binder.meta.fragment.appendChild(clone);
			// 		nodeLength++;
			//
			// 		// if (performance.now() - time > TIME) return;
			// 	}
			//
			// }

		},
		write () {

			if (this.currentLength === this.targetLength) {
				return false;
			} else if (this.currentLength > this.targetLength) {
				// while (binder.target.children.length > targetLength) {
					binder.target.removeChild(binder.target.lastElementChild);
				// }
			} else if (this.currentLength < this.targetLength) {
				// while (binder.target.children.length < targetLength) {
					binder.target.appendChild(document.importNode(binder.meta.template, true));
				// }
			}

			if (this.currentLength !== this.targetLength) {
				Batcher.batch(self.each(binder, data));
			}

			// if (this.remove) {
			// 	console.log(this.remove);
			// 	if (binder.target.lastElementChild === this.remove) {
			// 		binder.target.removeChild(this.remove);
			// 	}
			// } else if (this.add) {
			// 	console.log(this.add);
			// 	binder.target.appendChild(this.add);
			// }

			// binder.meta.busy = false;

			// if (binder.target.children.length !== data.length) {
			// if (this.currentLength !== this.targetLength) {
			// 	Batcher.batch(self.each(binder, data));
			// }

			// console.log(data.length);
			// console.log(binder.target.children.length);

			// if (binder.target.children.length !== data.length) {
			// 	self.default(binder, data);
			// }

		}
	};
};
