
export default function (binder) {
	return {
		read () {
			this.data = binder.data;
			if (this.data === binder.target.disabled) return false;
		},
		write () {
			binder.target.disabled = this.data;
		}
	};
};
