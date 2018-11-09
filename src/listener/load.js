import Loader from '../loader.js';
import Path from '../path.js';

export default function (e) {
	let element = e.target;

	if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
		return;
	}

	let path = Path.resolve(element.src || element.href);
	let load = Loader.data[path];

	Loader.ready(load);
}
