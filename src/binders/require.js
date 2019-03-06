
export default function (binder, data) {
	return {
		read () {
			if (data === binder.element.required) return false;
		},
		write () {
			binder.element.required = data;
		}
	};
};
