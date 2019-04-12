
export default function (binder) {
	return {
		read () {
			thsi.data = binder.data;
			if (thsi.data === binder.target.hidden) return false;
		},
		write () {
			binder.target.hidden = this.data;
		}
	};
};
