import Path from './path.js';

class General {

	constructor () {
		this.compiled = false;
	}

	setup (options) {
		options = options || {};

		if (options.base) {
			Path.base(options.base);
		}

	}

}

export default new General();
