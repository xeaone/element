
export default function (binder, data) {
	return {
		read () {
			if (data === binder.element.hidden) return false;
		},
		write () {
			binder.element.hidden = data;
		}

	};
};
