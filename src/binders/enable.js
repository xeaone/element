
export default function (binder, data) {
	return {
		read () {
			if (!data === binder.target.disabled) return false;
		},
		write () {
			binder.target.disabled = !data;
		}
	};
}
