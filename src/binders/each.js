import View from '../view.js';

export default function (binder, data) {

	if (data === undefined) {
		console.log('data undefined');
		return;
	}

	if (!binder.meta.template && !binder.target.children.length) {
		return;
	}

	if (binder.meta.length === undefined) {
		binder.meta.length = 0;
	}

	// console.log(binder.meta);

	if (binder.meta.template === undefined) {
		// console.log('\nremoveChild\n\n');
		// console.log(binder.target.firstElementChild);
		binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
	}

	const self = this;

	return {
		read () {
			this.keys = Object.keys(data);
			this.currentLength = binder.meta.length;
			this.targetLength = Array.isArray(data) ? data.length : this.keys.length;

			if (this.currentLength === this.targetLength) {
				return false;
			} else if (this.currentLength > this.targetLength) {
				this.type = 'remove';
				this.count = this.currentLength - this.targetLength;
				binder.meta.length = binder.meta.length - this.count;
			} else if (this.currentLength < this.targetLength) {
				this.type = 'add';
				this.count = this.targetLength - this.currentLength;
				binder.meta.length = binder.meta.length + this.count;
			}

		},
		write () {
			if (this.currentLength === this.targetLength) {
				return false;
			} else if (this.currentLength > this.targetLength) {
				while (this.count--) {
					// View.removeContextNode
					const node = binder.target.lastElementChild;
					binder.target.removeChild(node);
					View.removeContextNode(node);
				}
			} else if (this.currentLength < this.targetLength) {
				while (this.count--) {
					const node = document.importNode(binder.meta.template, true);

					View.addContextNode(node, {
						binder: binder,
						path: binder.path,
						container: binder.container,
						key: this.keys[this.currentLength++]
					});

					binder.target.appendChild(node);
				}
			}
		}
	};
};
