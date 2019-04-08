import Binder from '../binder.js';
import Batcher from '../batcher.js';

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

	if (binder.meta.template === undefined) {
		binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
	}

	const render = {
		read () {

			if (binder.meta.pending) {
				return false;
			} else {
				binder.meta.pending = true;
			}

			this.keys = Object.keys(data);
			this.targetLength = this.keys.length;
			this.currentLength = binder.meta.length;

			if (this.currentLength === this.targetLength) {
				return false;
			} else if (this.currentLength > this.targetLength) {
				this.count = this.currentLength - this.targetLength;
				binder.meta.length = binder.meta.length - this.count;
			} else if (this.currentLength < this.targetLength) {
				this.count = this.targetLength - this.currentLength;
				binder.meta.length = binder.meta.length + this.count;
			}

		},
		write () {

			if (this.currentLength === this.targetLength) {
				binder.meta.pending = false;
				return;
			} else if (this.currentLength > this.targetLength) {
				const element = binder.target.lastElementChild;
				binder.target.removeChild(element);
				Binder.remove(element);
				this.currentLength--;
			} else if (this.currentLength < this.targetLength) {
				const element = document.importNode(binder.meta.template, true);

				Binder.add(element, {
					path: binder.path,
					variable: binder.names[1],
					key: this.keys[this.currentLength++],
					container: binder.container,
					scope: binder.container.scope
				});

				binder.target.appendChild(element);
			}

			if (this.currentLength !== this.targetLength) {
				delete render.read;
				Batcher.batch(render);
			} else {
				binder.meta.pending = false;
			}

		}
	};

	return render;
};
