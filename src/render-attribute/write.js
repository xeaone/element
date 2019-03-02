
export default function (binder, data) {
	return {
		read () {
			if (!data === binder.element.readOnly) return false;
		},
		write () {
			binder.element.readOnly = !data;
		}
	};
};
