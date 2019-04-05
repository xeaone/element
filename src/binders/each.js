import Binder from '../binder.js';
// import View from '../view.js';

export default function (binder, data) {

	if (data === undefined) {
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
					const element = binder.target.lastElementChild;
					binder.target.removeChild(element);
					Binder.remove(element);
					// View.remove(element);
				}
			} else if (this.currentLength < this.targetLength) {
				while (this.count--) {
					const element = document.importNode(binder.meta.template, true);

					Binder.add(element, {
					// View.add(element, {
						path: binder.path,
						variable: binder.names[1],
						key: this.keys[this.currentLength++],
						container: binder.container,
						scope: binder.container.scope
					});

					binder.target.appendChild(element);
				}
			}
		}
	};
};
