import Path from './path.js';

export default {

	setup (options) {
		options = options || {};

		if (options.base) {
			Path.base(options.base);
		}

	}

};
