import Utility from './utility.js';

export default {

	data: {},

	get (path) {
		return Utility.getByPath(this.data, path);
	},

	set (path, data) {
		return Utility.setByPath(this.data, path, data);
	}

};
