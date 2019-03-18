// import EachRemove from '../each-remove.js';
// import EachAdd from '../each-add.js';
import View from '../view.js';

const AddContextNode = function (node, context) {
	View.context.set(node, context);
	AddContextNodes(node.childNodes, context);
};

const AddContextNodes = function (nodes, context) {
	for (let i = 0, l = nodes.length; i <l; i++) {
		AddContextNode(nodes[i], context);
	}
};

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

	if (binder.meta.children === undefined) {
		binder.meta.children = new Map();
	}

	if (binder.meta.length === undefined) {
		binder.meta.length = 0;
	}

	if (binder.meta.template === undefined) {
		console.log('\nremoveChild\n\n');
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
					const node = binder.target.lastElementChild;
					binder.target.removeChild(node);
					binder.meta.children.delete(node);
					// EachRemove(node, binder.names[1], binder.path, this.keys[this.currentLength++], binder.container);
				}
			} else if (this.currentLength < this.targetLength) {
				while (this.count--) {
					const node = document.importNode(binder.meta.template, true);

					// View.addContainerNode(node, binder.container);
					// View.addContainerNodes(node, binder.container);
					// node.setAttribute('o-context', `${this.keys[this.currentLength++]} ${binder.path} ${binder.names[1]}`);

					AddContextNode(node, {
						binder: binder,
						path: binder.path,
						// index: this.currentLength,
						key: this.keys[this.currentLength++]
					});

					// EachAdd(node, binder.names[1], binder.path, this.keys[this.currentLength++], binder.container);
					binder.target.appendChild(node);
				}
			}
		}
	};
};
