import Utility from '../utility.js';
import Batcher from '../batcher.js';

// const TIME = 15;

export default function (binder, data) {

	if (data === undefined) {
		console.log('data undefined');
		return;
	}

	if (!binder.meta.template && !binder.target.children.length) {
		return;
	}

	// if (binder.meta.fragment === undefined) {
	// 	binder.meta.fragment = document.createDocumentFragment();
	// }

	if (binder.meta.length === undefined) {
		binder.meta.length = 0;
	}

	if (binder.meta.template === undefined) {
		console.log('\nremoveChild\n\n');
		console.log(binder.meta.template);
		binder.meta.template = binder.target.removeChild(binder.target.firstElementChild);
	}

	const self = this;

	return {
		read () {
			console.log('READ');

			// need to account for Objet
			this.keys = Object.keys(data);
			this.currentLength = binder.meta.length;
			this.targetLength = Array.isArray(data) ? data.length : this.keys.length;

			if (this.currentLength === this.targetLength) {
				console.log('READ: length same');
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
			console.log('WRITE');

			if (this.currentLength === this.targetLength) {
				console.log('WRITE: length same');
				return false;
			} else if (this.currentLength > this.targetLength) {
				// while (this.count--) {
				// 	binder.target.removeChild(binder.target.lastElementChild);
				// }
			} else if (this.currentLength < this.targetLength) {
				while (this.count--) {

					const node = document.importNode(binder.meta.template, true);

					console.log(node);
					console.log('type',this.type);
					console.log('this.currentLength',this.currentLength);
					console.log('binder.meta.length',binder.meta.length);
					console.log('binder.target.children.length',binder.target.children.length);

					// Utility.rewrite(node, binder.names[1], binder.path, this.keys[binder.target.children.length]);
					Utility.rewrite(node, binder.names[1], binder.path, this.keys[this.currentLength++]);

					binder.target.appendChild(node);
				}
			}

		}
	};
};
