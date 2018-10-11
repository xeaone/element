import Update from '../update.js';

export default function (e) {
	if (
		e.target.type !== 'checkbox'
		&& e.target.type !== 'radio'
		&& e.target.type !== 'option'
		&& e.target.nodeName !== 'SELECT'
		&& e.target.hasAttribute('o-value')
	) {
		Update(e.target, 'value').catch(console.error);
	}
}
