import Global from './global.js';

export default function (e) {
	if (e.target.hasAttribute('o-value')) {

		let binder = Global.binder.get({
			name: 'o-value',
			element: e.target,
		});

		Global.binder.render(binder);
	}
}
