import Utility from './utility.js';

const DATA = {};

export default {

	get (path) {
		return Utility.getByPath(DATA, path);
	},

	set (path, data) {
		return Utility.setByPath(DATA, path, data);
	}

}
