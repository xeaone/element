
export default {

	events: {},

	on (name, method) {

		if (!(name in this.events)) {
			this.events[name] = [];
		}

		this.events[name].push(method);
	},

	off (name, method) {

		if (name in this.events) {

			let index = this.events[name].indexOf(method);

			if (index !== -1) {
				this.events[name].splice(index, 1);
			}

		}

	},

	emit (name) {

		if (name in this.events) {

			let methods = this.events[name];
			let args = Array.prototype.slice.call(arguments, 1);

			for (let i = 0, l = methods.length; i < l; i++) {
				methods[i].apply(this, args);
			}

		}

	}

};
