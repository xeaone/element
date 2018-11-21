import Update from '../update.js';

export default function (event) {
	if (
		event.target.type !== 'checkbox'
		&& event.target.type !== 'radio'
		&& event.target.type !== 'option'
		&& event.target.nodeName !== 'SELECT'
		&& event.target.hasAttribute('o-value')
	) {
		Promise.resolve().then(function () {
			return Update(event.target, 'value');
		}).catch(console.error);
	}
};
