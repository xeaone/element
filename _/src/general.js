import Path from './lib/path.js';

export default class General {

	constructor (options) {
		this.setup(options);
	}

	setup (options) {
		options = options || {};

		if (options.base) {
			Path.base(options.base);
		}

	}

}
