import Batcher from '../batcher.js';

export default function (binder) {
	var unrender;

	if (binder.type in this) {
		unrender = this[binder.type](binder);
	} else {
		unrender = {
			read () {
				if (binder.element[binder.type] === '') {
					return false;
				}
			},
			write () {
				binder.element[binder.type] = '';
			}
		};
	}

	Batcher.batch(unrender);
};
