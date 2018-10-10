import Global from './global.js';

export default function (e) {
	if (
		e.target.type !== 'checkbox'
		&& e.target.type !== 'radio'
		&& e.target.type !== 'option'
		&& e.target.nodeName !== 'SELECT'
		&& e.target.hasAttribute('o-value')
	) {

		let binder = Global.binder.get({
			name: 'o-value',
			element: e.target,
		});

		Global.binder.render(binder);
	}
}
