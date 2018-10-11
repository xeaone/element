import Utility from './utility.js';

class Methods {

	constructor () {
		this.data = {};
	}

	get (path) {
		return Utility.getByPath(this.data, path);
	}

	set (path, data) {
		return Utility.setByPath(this.data, path, data);
	}

}

export default new Methods();
