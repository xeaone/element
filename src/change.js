import Update from './update.js';

export default function (e) {
	if (e.target.hasAttribute('o-value')) {
		Update(e.target, 'value').catch(console.error);
	}
}
