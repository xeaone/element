
export default function (binder, data) {
	return {
		read () {
			if (data === binder.target.required) return false;
		},
		write () {
			binder.target.required = data;
		}
	};
};
