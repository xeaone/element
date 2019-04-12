
export default function (binder) {
	return {
		read () {
			this.data = binder.data;
		},
		write () {
			if (!this.data) {
				binder.target.style = '';
			} else if (this.data.constructor === Object) {
				for (const name in this.data) {
					const value = this.data[name];
					if (value === null || value === undefined) {
						delete binder.target.style[name];
					} else {
						binder.target.style[name] = value;
					}
				}
			}
		}
	};
};
