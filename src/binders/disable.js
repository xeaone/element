
export default function (binder, data) {
	return {
		read () {
			if (data === binder.element.disabled) return false;
		},
		write () {
			binder.element.disabled = data;
		}
	};
};
