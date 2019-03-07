
export default function (binder, data) {
	return {
		read () {
			if (data === binder.target.hidden) return false;
		},
		write () {
			binder.target.hidden = data;
		}

	};
};
