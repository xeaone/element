import Loader from '../loader.js';
import Path from '../path.js';

export default function (e) {
	var element = e.target;

	if (element.nodeType !== 1 || !element.hasAttribute('o-load')) {
		return;
	}

	var path = Path.resolve(element.src || element.href);
	var load = Loader.data[path];

	Loader.ready(load);
};
