
export default function (binder) {
	return {
		read () {
			this.data = binder.data || '';

			if (this.data === binder.target.href) {
				return false;
			}

		},
		write () {
			binder.target.href = this.data;
		}
	};
};
