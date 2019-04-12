
export default function (binder) {
	return {
		read () {
			this.data = binder.data;

			if (this.data === binder.target.readOnly) {
				return false;
			}
			
		},
		write () {
			binder.target.readOnly = this.data;
		}
	};
};
