import Loader from '../loader.js';
import Path from '../path.js';

export default function (e) {
	const element = e.target;

	if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
		return;
	}

	const path = Path.resolve(element.src || element.href);
	const load = Loader.data[path];

	Loader.ready(load);
}
