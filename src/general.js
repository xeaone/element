import Path from './path.js';

export default {

	compiled: false,

	setup (options) {
		options = options || {};

		if (options.base) {
			Path.base(options.base);
		}

	}

};
