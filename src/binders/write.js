
export default function (binder, data) {
	return {
		read () {
			if (!data === binder.target.readOnly) return false;
		},
		write () {
			binder.target.readOnly = !data;
		}
	};
};
