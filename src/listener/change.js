import Update from '../update.js';

export default function (event) {
	if (event.target.hasAttribute('o-value')) {
		Promise.resolve().then(function () {
			return Update(event.target, 'value');
		}).catch(console.error);
	}
};
