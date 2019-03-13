
export default class Store {

	constructor () {
		Object.defineProperties(this, {
			data: {
				value: []
			}
		});
	}

	get (data) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i][0] === data) {
				return this.data[i][0];
			}
		}
		return null;
	}

	has (data) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i][0] === data) {
				return true;
			}
		}
		return false;
	}

	set (key, value) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i][0] === data) {
				this.data[i] = [key, value];
				break;
			}
		}
		this.data.push([key, value]);
	}

	add (key, value) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i][0] === data) {
				throw new Error(`Oxe.store.add - ${key} exists`);
			}
		}
		this.data.push([key, value]);
	}

	remove (key) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i][0] === data) {
				this.data.splice(i, 1);
				break;
			}
		}
	}

	size () {
		return this.data.length;
	}

};
